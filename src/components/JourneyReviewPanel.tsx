import { html } from 'hono/html'

const reviews = [
  ['sources', 'Source fidelity', 'Compare lesson content, citations and answers with the original material.'],
  ['religious', 'Religious review', 'Record the qualified reviewer for Qur’an, Hadith, Tafsir and fiqh.'],
  ['language', 'Language and Arabic', 'Check Arabic text, translations, subtitles and age-appropriate language.'],
  ['childSafety', 'Child safety and accessibility', 'Check age-group suitability, privacy and accessible alternatives.'],
  ['audio', 'Audio accuracy and rights', 'Record recitation verification and permission for the intended distribution.'],
] as const

export const JourneyReviewPanel = () => html`
<section class="card" id="dash-journey-review" style="display:none">
  <style>
    #dash-journey-review [hidden] { display:none !important; }
    #dash-journey-review .jr-fields { display:grid; gap:12px; margin-block:14px; }
    #dash-journey-review label { display:grid; gap:4px; font-size:.85rem; font-weight:600; }
    #dash-journey-review input, #dash-journey-review select, #dash-journey-review textarea { width:100%; padding:8px; border:1px solid var(--border-color); border-radius:6px; }
    #dash-journey-review fieldset { border:1px solid var(--border-color); border-radius:8px; padding:12px; }
    #dash-journey-review legend { padding-inline:6px; font-weight:600; }
    #dash-journey-review fieldset p { font-size:.85rem; margin-bottom:8px; }
    #dash-journey-review dl { display:grid; gap:4px; margin-block:12px; }
    #dash-journey-review dt { font-weight:600; }
    #dash-journey-review dd { margin-bottom:8px; overflow-wrap:anywhere; }
    #dash-journey-review .jr-actions { display:flex; flex-wrap:wrap; gap:8px; }
    #dash-journey-review button { cursor:pointer; padding:8px 12px; border:1px solid var(--border-color); border-radius:6px; background:var(--white); color:var(--text-dark); }
    #dash-journey-review button:disabled { opacity:.6; cursor:default; }
  </style>
  <div class="card-header"><h2 class="card-title">Learning Journey review</h2></div>
  <label for="jr-file">Curriculum release package</label>
  <input id="jr-file" type="file" accept=".json,application/json" aria-describedby="jr-message">
  <p id="jr-message" role="status" aria-live="polite">Open the generated Journey package to review its lessons.</p>
  <div id="jr-body" hidden>
    <div class="jr-fields">
      <label>Level number <input id="jr-level" type="number" min="1" max="1000" value="1"></label>
    </div>
    <h3 id="jr-title"></h3>
    <dl id="jr-details"></dl>
    <form id="jr-level-form" class="jr-fields" hidden>
      <fieldset id="jr-level-fields" class="jr-fields">
        <legend>Level review</legend>
        <label>Review status
          <select id="jr-level-status" required>
            <option value="">Pending review</option>
            <option value="needs_changes">Needs corrections</option>
            <option value="ready_for_review">Ready for re-review</option>
            <option value="checked">Checked</option>
          </select>
        </label>
        <label>Correction or review notes <textarea id="jr-level-note" maxlength="1000" rows="3"></textarea></label>
        <button type="submit">Save level review</button>
      </fieldset>
      <p id="jr-level-result" role="status"></p>
    </form>
    <form id="jr-form">
      <div class="jr-fields">
        ${reviews.map(([key, name, description]) => html`
          <fieldset data-review="${key}">
            <legend>${name}</legend><p>${description}</p>
            <div class="jr-fields">
              <label>Reviewer name <input data-reviewer maxlength="120"></label>
              <label>Review record or evidence <input data-evidence maxlength="600"></label>
            </div>
          </fieldset>`)}
      </div>
      <div class="jr-actions">
        <button id="jr-save" type="submit">Save review</button>
        <button id="jr-publish" type="button" disabled>Publish approved package</button>
        <button id="jr-revoke" type="button" hidden>Withdraw publication</button>
      </div>
      <p id="jr-result" role="status" aria-live="polite"></p>
    </form>
  </div>
</section>`

export const journeyReviewScript = String.raw`
  (() => {
    const file = document.getElementById('jr-file');
    const body = document.getElementById('jr-body');
    const message = document.getElementById('jr-message');
    const levelInput = document.getElementById('jr-level');
    const title = document.getElementById('jr-title');
    const details = document.getElementById('jr-details');
    const levelForm = document.getElementById('jr-level-form');
    const levelFields = document.getElementById('jr-level-fields');
    const levelStatus = document.getElementById('jr-level-status');
    const levelNote = document.getElementById('jr-level-note');
    const levelResult = document.getElementById('jr-level-result');
    const form = document.getElementById('jr-form');
    const save = document.getElementById('jr-save');
    const publish = document.getElementById('jr-publish');
    const revoke = document.getElementById('jr-revoke');
    const result = document.getElementById('jr-result');
    const fields = [...form.querySelectorAll('[data-review]')];
    let current = null;
    let saved = {};
    let revision = null;
    let active = false;
    let busy = false;
    let levelRequest = 0;
    let levelRevision = null;

    function currentChecks() {
      return Object.fromEntries(fields.flatMap((field) => {
        const reviewer = field.querySelector('[data-reviewer]').value.trim();
        const evidence = field.querySelector('[data-evidence]').value.trim();
        return reviewer || evidence ? [[field.dataset.review, { reviewer, evidence }]] : [];
      }));
    }

    function refresh() {
      const checks = currentChecks();
      const dirty = fields.some(({ dataset }) => {
        const a = checks[dataset.review], b = saved[dataset.review];
        return a?.reviewer !== b?.reviewer || a?.evidence !== b?.evidence;
      });
      save.disabled = busy || active || !dirty;
      publish.disabled = busy || active || dirty || !fields.every((field) =>
        saved[field.dataset.review]?.reviewer && saved[field.dataset.review]?.evidence);
      publish.hidden = active;
      levelFields.disabled = active || busy || levelFields.dataset.loaded !== 'true';
      revoke.hidden = !active;
      revoke.disabled = busy;
      for (const field of fields) field.disabled = active || busy;
      file.disabled = busy;
    }

    async function showLevel() {
      const request = ++levelRequest;
      const item = current?.levels[Number(levelInput.value) - 1];
      levelForm.hidden = !item;
      levelFields.dataset.loaded = 'false';
      refresh();
      if (!item) {
        title.textContent = 'Enter a level from 1 to 1000.';
        details.replaceChildren();
        return;
      }
      title.textContent = item.id + ' · ' + item.title;
      const brief = item.brief;
      const descriptions = [
        ['Source', brief.sourcePdf + ' · p. ' + brief.sourcePages + ' · ' + item.sourceUnit],
        ['Age and accessibility', brief.accessibility],
        ['Objective', brief.objective],
        ['Activity', brief.activity],
        ['Assessment', brief.decision],
        ['Expected response', brief.rubric],
        ['Mastery rule', brief.mastery],
        ['Release gate', brief.releaseGate],
      ];
      details.replaceChildren(...descriptions.flatMap(([label, value]) => {
        const term = document.createElement('dt');
        const definition = document.createElement('dd');
        term.textContent = label;
        definition.textContent = value;
        return [term, definition];
      }));
      levelStatus.value = '';
      levelNote.value = '';
      levelResult.textContent = 'Loading level review…';
      try {
        const snapshot = await getDoc(doc(db, 'journey_reviews', current.releaseHash, 'levels', item.id));
        if (request !== levelRequest) return;
        const review = snapshot.data();
        levelRevision = review?.updatedAt ?? null;
        levelStatus.value = review?.status ?? '';
        levelNote.value = review?.note ?? '';
        levelResult.textContent = '';
        levelFields.dataset.loaded = 'true';
      } catch (_) {
        if (request === levelRequest) levelResult.textContent = 'Level review could not be opened.';
      } finally {
        if (request === levelRequest) refresh();
      }
    }

    async function openFile() {
      current = null;
      levelRequest++;
      body.hidden = true;
      const selected = file.files[0];
      if (!selected) return;
      busy = true;
      refresh();
      message.textContent = 'Checking the release package…';
      try {
        if (selected.size > 8 * 1024 * 1024) throw new Error('Choose the generated Journey JSON file.');
        const { releaseHash, ...data } = JSON.parse(await selected.text());
        if (data.schema !== 2 || typeof data.curriculumVersion !== 'string' ||
            !Array.isArray(data.levels) || data.levels.length !== 1000 ||
            data.levels.some((level, index) => level?.number !== index + 1 || !level.brief) ||
            typeof data.dependencies !== 'object' || !/^[0-9a-f]{64}$/.test(releaseHash)) {
          throw new Error('Choose a generated Journey release package.');
        }
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(data)));
        if ([...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('') !== releaseHash) {
          throw new Error('The package contents changed after it was generated.');
        }
        const [review, publication] = await Promise.all([
          getDoc(doc(db, 'journey_reviews', releaseHash)),
          getDoc(doc(db, 'journey_publications', releaseHash)),
        ]);
        current = { ...data, releaseHash };
        saved = review.data()?.checks ?? {};
        revision = review.data()?.updatedAt ?? null;
        active = publication.data()?.active === true;
        for (const field of fields) {
          const check = saved[field.dataset.review];
          field.querySelector('[data-reviewer]').value = check?.reviewer ?? '';
          field.querySelector('[data-evidence]').value = check?.evidence ?? '';
        }
        message.textContent = data.curriculumVersion + ' · ' + releaseHash.slice(0, 12);
        result.textContent = active ? 'This package is published.' : 'This package is in review.';
        body.hidden = false;
        showLevel();
      } catch (error) {
        console.error('Could not open Journey review package', error);
        message.textContent = 'Could not open the package. Check the file and your admin sign-in.';
      } finally {
        busy = false;
        refresh();
      }
    }

    async function persist(action) {
      if (!current || busy || !auth.currentUser) return;
      busy = true;
      refresh();
      try {
        const version = current.curriculumVersion;
        const updatedBy = auth.currentUser.uid;
        const reviewRef = doc(db, 'journey_reviews', current.releaseHash);
        const publicationRef = doc(db, 'journey_publications', current.releaseHash);
        if (action === 'save') {
          const checks = currentChecks();
          if (Object.values(checks).some((value) => !value.reviewer || !value.evidence)) {
            result.textContent = 'Enter both the reviewer name and evidence for each recorded check.';
            return;
          }
          await runTransaction(db, async (transaction) => {
            const previous = (await transaction.get(reviewRef)).data()?.updatedAt ?? null;
            if (previous ? !revision || !previous.isEqual(revision) : revision !== null) {
              throw new Error('Another admin updated the review.');
            }
            transaction.set(reviewRef, { version, checks, updatedBy, updatedAt: serverTimestamp() });
          });
          const fresh = (await getDoc(reviewRef)).data();
          saved = fresh?.checks ?? {};
          revision = fresh?.updatedAt ?? null;
          for (const field of fields) {
            const check = saved[field.dataset.review];
            field.querySelector('[data-reviewer]').value = check?.reviewer ?? '';
            field.querySelector('[data-evidence]').value = check?.evidence ?? '';
          }
          result.textContent = 'Review saved.';
        } else {
          const next = action === 'publish';
          await runTransaction(db, async (transaction) => {
            if (next) {
              const previous = (await transaction.get(reviewRef)).data()?.updatedAt ?? null;
              if (!previous || !revision || !previous.isEqual(revision)) throw new Error('The review was updated.');
            }
            transaction.set(publicationRef, { version, active: next, updatedAt: serverTimestamp() });
          });
          active = next;
          result.textContent = next ? 'This exact package is published.' : 'Publication withdrawn.';
        }
      } catch (error) {
        console.error('Could not update Journey review', error);
        result.textContent = 'The update failed. Check the current review state and try again.';
      } finally {
        busy = false;
        refresh();
      }
    }

    file.addEventListener('change', openFile);
    levelInput.addEventListener('input', showLevel);
    form.addEventListener('input', refresh);
    form.addEventListener('submit', (event) => { event.preventDefault(); persist('save'); });
    levelForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const item = current?.levels[Number(levelInput.value) - 1];
      if (!item || busy || active || levelFields.dataset.loaded !== 'true' || !auth.currentUser) return;
      const status = levelStatus.value;
      const note = levelNote.value.trim();
      if (status === 'needs_changes' && !note) {
        levelResult.textContent = 'Describe the correction before saving.';
        return;
      }
      const ref = doc(db, 'journey_reviews', current.releaseHash, 'levels', item.id);
      const reviewedRevision = levelRevision;
      busy = true;
      levelInput.disabled = true;
      refresh();
      try {
        await runTransaction(db, async (transaction) => {
          const prior = (await transaction.get(ref)).data()?.updatedAt ?? null;
          if (prior ? !reviewedRevision || !prior.isEqual(reviewedRevision) : reviewedRevision !== null) {
            throw new Error('This level review changed.');
          }
          transaction.set(ref, { status, note, updatedBy: auth.currentUser.uid, updatedAt: serverTimestamp() });
        });
        await showLevel();
        levelResult.textContent = 'Level review saved.';
      } catch (_) {
        levelResult.textContent = 'Could not save. Reopen this level to check the latest review.';
      } finally {
        busy = false;
        levelInput.disabled = false;
        refresh();
      }
    });
    publish.addEventListener('click', () => persist('publish'));
    revoke.addEventListener('click', () => persist('revoke'));
  })();
`
