const { createHash, randomBytes } = require('node:crypto');

const INVITE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

function createAdminInvite(orgId) {
  const token = randomBytes(32).toString('base64url');
  const expires = Date.now() + INVITE_LIFETIME_MS;
  return {
    fields: { admin_invite_hash: digest(token), admin_invite_expires: expires },
    path: '/organisation-invite?org=' + encodeURIComponent(orgId) + '#' + token
  };
}

function digest(token) {
  return createHash('sha256').update(token).digest('hex');
}

function schoolJoinPath(org) {
  const token = org.get('join_token');
  return token ? '/join?org=' + encodeURIComponent(org.get('slug')) + '#' + token : null;
}

function makeOrganisationPortal({ db, HttpsError, FieldValue, requireStaff }) {
  function documentId(id, label) {
    if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
      throw new HttpsError('invalid-argument', 'Choose a valid ' + label + '.');
    }
    return id;
  }

  function inviteInput(data = {}) {
    const orgId = documentId(data.org_id, 'organisation');
    const token = typeof data.token === 'string' ? data.token : '';
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
      throw new HttpsError('not-found', 'This account invite is invalid or has expired.');
    }
    return { orgRef: db.collection('orgs').doc(orgId), token };
  }

  function checkInvite(org, token) {
    if (!org.exists || org.get('status') !== 'active' || org.get('admin_uid') ||
        !(org.get('admin_invite_expires') > Date.now()) || org.get('admin_invite_hash') !== digest(token)) {
      throw new HttpsError('not-found', 'This account invite is invalid or has expired. Ask the Super Admin for a current invite.');
    }
  }

  function requireOrganisation(org, uid) {
    if (!org.exists || org.get('status') !== 'active' || org.get('admin_uid') !== uid) {
      throw new HttpsError('permission-denied', 'This organisation is unavailable to your account.');
    }
  }

  async function organisationFor(request) {
    const caller = await requireStaff(request, ['org_admin']);
    const ref = db.collection('orgs').doc(documentId(caller.org_id, 'organisation'));
    return { caller, ref };
  }

  async function inviteOrgAdmin(request) {
    await requireStaff(request, ['super_admin']);
    const orgId = documentId(request.data?.org_id, 'organisation');
    const ref = db.collection('orgs').doc(orgId);
    const invite = createAdminInvite(orgId);
    await db.runTransaction(async (tx) => {
      const org = await tx.get(ref);
      if (!org.exists || org.get('status') !== 'active') {
        throw new HttpsError('not-found', 'This organisation is unavailable.');
      }
      if (org.get('admin_uid')) {
        throw new HttpsError('failed-precondition', 'This organisation already has an admin. They can reset their password from Organisation login.');
      }
      tx.update(ref, invite.fields);
    });
    return { invite_path: invite.path };
  }

  async function describeOrgAdminInvite(request) {
    const { orgRef, token } = inviteInput(request.data);
    const org = await orgRef.get();
    checkInvite(org, token);
    return { name: org.get('name') };
  }

  async function redeemOrgAdminInvite(request) {
    const uid = request.auth?.uid;
    const email = request.auth?.token?.email;
    if (!uid || !email) throw new HttpsError('unauthenticated', 'Sign in with an email address to accept this invite.');
    const { orgRef, token } = inviteInput(request.data);
    const profileRef = db.collection('users').doc(uid);

    await db.runTransaction(async (tx) => {
      const org = await tx.get(orgRef);
      const profile = await tx.get(profileRef);
      if (org.exists && org.get('status') === 'active' && org.get('admin_uid') === uid &&
          profile.exists && profile.get('role') === 'org_admin' && profile.get('org_id') === orgRef.id) {
        return;
      }
      checkInvite(org, token);
      if (profile.exists) {
        throw new HttpsError('already-exists', 'Use an email address that is not already assigned to another Imaan & Akhlaq account.');
      }
      tx.create(profileRef, { role: 'org_admin', org_id: orgRef.id, email, name: org.get('name') });
      tx.update(orgRef, {
        admin_uid: uid,
        admin_joined_at: new Date().toISOString(),
        admin_invite_hash: FieldValue.delete(),
        admin_invite_expires: FieldValue.delete()
      });
    });
    return { org_id: orgRef.id };
  }

  async function getOrganisationDashboard(request) {
    const { caller, ref } = await organisationFor(request);
    const org = await ref.get();
    requireOrganisation(org, caller.uid);
    const schools = await db.collection('schools').where('org_id', '==', ref.id).get();
    return {
      name: org.get('name'),
      join_path: schoolJoinPath(org),
      schools: schools.docs.map((school) => ({
        school_id: school.id,
        name: school.get('name') || '',
        location: school.get('location') || '',
        created_at: school.get('created_at') || '',
        status: school.get('approval_status') || 'registered'
      })).sort((a, b) => b.created_at.localeCompare(a.created_at) || a.name.localeCompare(b.name))
    };
  }

  async function updateOrganisationSchool(request) {
    const { caller, ref } = await organisationFor(request);
    const schoolId = documentId(request.data?.school_id, 'school');
    const name = typeof request.data?.name === 'string' ? request.data.name.trim() : '';
    const location = typeof request.data?.location === 'string' ? request.data.location.trim() : '';
    if (!name || name.length > 160 || location.length > 160) {
      throw new HttpsError('invalid-argument', 'Enter a school name and keep each field under 161 characters.');
    }
    const school = db.collection('schools').doc(schoolId);
    await db.runTransaction(async (tx) => {
      const org = await tx.get(ref);
      requireOrganisation(org, caller.uid);
      const details = await tx.get(school);
      if (!details.exists || details.get('org_id') !== ref.id) {
        throw new HttpsError('not-found', 'This school is not linked to your organisation.');
      }
      tx.update(school, { name, location });
    });
    return { school_id: schoolId, name, location };
  }

  return { inviteOrgAdmin, describeOrgAdminInvite, redeemOrgAdminInvite, getOrganisationDashboard, updateOrganisationSchool };
}

module.exports = { createAdminInvite, schoolJoinPath, makeOrganisationPortal };
