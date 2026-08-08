import { describe, it, expect } from 'vitest'
import { app } from '../app'

describe('Hono Routes', () => {
  it('should return 200 for homepage', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(200)
  })

  it('should return 200 for auth page', async () => {
    const res = await app.request('/auth')
    expect(res.status).toBe(200)
  })

  it('should return 200 for student activities page', async () => {
    const res = await app.request('/student-activities')
    expect(res.status).toBe(200)
  })

  it('should return 200 for teacher dashboard', async () => {
    const res = await app.request('/teacher-dashboard')
    expect(res.status).toBe(200)
  })

  // The separate parent account is retired: a family shares the student login
  // and opens Parent Area behind a PIN. The route must stay gone so nobody
  // wires a dashboard back up without revisiting that decision.
  it('should return 404 for the retired parent dashboard', async () => {
    const res = await app.request('/parent-dashboard')
    expect(res.status).toBe(404)
  })

  it('should return 200 for admin dashboard', async () => {
    const res = await app.request('/admin-dashboard')
    expect(res.status).toBe(200)
  })

  it('should return 200 for super admin dashboard', async () => {
    const res = await app.request('/super-admin-dashboard')
    expect(res.status).toBe(200)
  })

  it('should return 200 for club portal', async () => {
    const res = await app.request('/club')
    expect(res.status).toBe(200)
  })

  it('should return 404 for non-existent routes', async () => {
    const res = await app.request('/this-page-does-not-exist')
    expect(res.status).toBe(404)
  })

  it('should redirect .html URLs to clean URLs', async () => {
    const res = await app.request('/auth.html')
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/auth')
  })

  it('should redirect /index.html to /', async () => {
    const res = await app.request('/index.html')
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/')
  })

  it('should return JSON for api-activities', async () => {
    const res = await app.request('/api-activities')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('application/json')
  })

  // About pages
  it('should return 200 for about/intro', async () => {
    const res = await app.request('/about/intro')
    expect(res.status).toBe(200)
  })

  it('should redirect /about to /about/intro', async () => {
    const res = await app.request('/about')
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/about/intro')
  })

  // Products
  it('should redirect /products to /products/books', async () => {
    const res = await app.request('/products')
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/products/books')
  })

  it('should return 200 for blog page', async () => {
    const res = await app.request('/blog')
    expect(res.status).toBe(200)
  })

  // Media dropdown
  it('should return 200 for media/videos', async () => {
    const res = await app.request('/media/videos')
    expect(res.status).toBe(200)
  })

  it('should return 200 for media/news', async () => {
    const res = await app.request('/media/news')
    expect(res.status).toBe(200)
  })

  it('should redirect /media to /blog', async () => {
    const res = await app.request('/media')
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/blog')
  })
})
