import { useCallback, useEffect, useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/restaurantreview'

const emptyForm = {
  reviewerName: '',
  rating: '5',
  comments: '',
  reviewDate: new Date().toISOString().slice(0, 10)
}

function errorMessage(data, fallback) {
  if (typeof data === 'string' && data.trim()) return data
  if (data?.message) return data.message
  if (data?.error) return data.error
  return fallback
}

function Stars({ rating = 0 }) {
  return <span className="stars" aria-label={`${rating} out of 5 stars`}>
    {Array.from({ length: 5 }, (_, i) => <i key={i} className={`bi ${i < Number(rating) ? 'bi-star-fill' : 'bi-star'}`} />)}
  </span>
}

function App() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const request = async (path = '', options = {}) => {
    let response
    try {
      response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
      })
    } catch {
      throw new Error('Cannot connect to the backend. Make sure Spring Boot is running on port 8081.')
    }
    const raw = await response.text()
    let data = raw
    try { data = raw ? JSON.parse(raw) : null } catch {}
    if (!response.ok) throw new Error(errorMessage(data, `Request failed (${response.status})`))
    return data
  }

  const loadReviews = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true)
    setError('')
    try {
      const data = await request('/displayall')
      setReviews(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message || 'Unable to load reviews.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadReviews() }, [loadReviews])

  const stats = useMemo(() => {
    const count = reviews.length
    const average = count ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / count : 0
    return { count, average: average.toFixed(1), five: reviews.filter(r => Number(r.rating) === 5).length, low: reviews.filter(r => Number(r.rating) <= 2).length }
  }, [reviews])

  const visibleReviews = useMemo(() => reviews.filter(r => {
    const needle = query.trim().toLowerCase()
    const matchesQuery = !needle || [r.reviewerName, r.comments, r.reviewDate, String(r.id)].some(v => String(v ?? '').toLowerCase().includes(needle))
    const matchesRating = ratingFilter === 'all' || Number(r.rating) === Number(ratingFilter)
    return matchesQuery && matchesRating
  }), [reviews, query, ratingFilter])

  const startAdd = () => {
    setEditingId(null)
    setForm({ ...emptyForm, reviewDate: new Date().toISOString().slice(0, 10) })
    setFormErrors({})
    setError('')
    setShowForm(true)
    setNotice('')
  }

  const startEdit = (review) => {
    setEditingId(review.id)
    setForm({
      reviewerName: review.reviewerName || '',
      rating: String(review.rating ?? 5),
      comments: review.comments || '',
      reviewDate: review.reviewDate || ''
    })
    setFormErrors({})
    setError('')
    setNotice('')
    setShowForm(true)
  }

  const validate = () => {
    const next = {}
    if (!form.reviewerName.trim()) next.reviewerName = 'Reviewer name is required.'
    else if (form.reviewerName.trim().length < 2) next.reviewerName = 'Enter at least 2 characters.'
    else if (form.reviewerName.trim().length > 60) next.reviewerName = 'Name must be 60 characters or fewer.'
    if (!form.rating || !Number.isInteger(Number(form.rating)) || Number(form.rating) < 1 || Number(form.rating) > 5) next.rating = 'Choose a rating from 1 to 5.'
    if (!form.comments.trim()) next.comments = 'Please enter a comment.'
    else if (form.comments.trim().length > 1000) next.comments = 'Comments must be 1000 characters or fewer.'
    if (!form.reviewDate) next.reviewDate = 'Review date is required.'
    else if (Number.isNaN(Date.parse(form.reviewDate))) next.reviewDate = 'Enter a valid date.'
    setFormErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setNotice('')
    setError('')
    if (!validate()) return
    setSaving(true)
    const payload = {
      reviewerName: form.reviewerName.trim(),
      rating: Number(form.rating),
      comments: form.comments.trim(),
      reviewDate: form.reviewDate
    }
    try {
      if (editingId !== null) {
        await request(`/update/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) })
        setNotice('Review updated successfully.')
      } else {
        await request('/add', { method: 'POST', body: JSON.stringify(payload) })
        setNotice('Review added successfully.')
      }
      setShowForm(false)
      setForm(emptyForm)
      setEditingId(null)
      await loadReviews(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setError(e.message || 'Unable to save this review.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setError('')
    setNotice('')
    try {
      await request(`/delete/${deleteTarget.id}`, { method: 'DELETE' })
      setNotice(`Review #${deleteTarget.id} deleted successfully.`)
      setDeleteTarget(null)
      await loadReviews(false)
    } catch (e) {
      setError(e.message || 'Unable to delete this review.')
      setDeleteTarget(null)
    }
  }

  const closeForm = () => {
    setShowForm(false)
    setFormErrors({})
    setEditingId(null)
  }

  return (
    <div className="app-shell">
      <nav className="navbar navbar-expand navbar-dark app-navbar simple-navbar">
        <div className="container">
          <a className="navbar-brand d-flex align-items-center gap-2" href="#home" onClick={() => { setShowForm(false); setQuery(''); }}>
            <i className="bi bi-chat-square-heart-fill" />
            <span>Restaurant Reviews</span>
          </a>
          <div className="d-flex align-items-center simple-nav-links">
            <a className="nav-link" href="#home" onClick={() => setShowForm(false)}><i className="bi bi-house me-1" />Home</a>
            <button className="nav-link simple-nav-button" onClick={startAdd}><i className="bi bi-plus-circle me-1" />Add Review</button>
            <a className="nav-link" href="#reviews" onClick={() => setShowForm(false)}><i className="bi bi-list-ul me-1" />View Reviews</a>
          </div>
        </div>
      </nav>

      <main className="container py-4 py-lg-5" id="home">
        <section className="hero-card">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> RESTAURANT FEEDBACK</div>
            <h1>Every review tells<br className="d-none d-sm-block" /> a <span>better story.</span></h1>
            <p>Manage restaurant experiences in one simple place. Add feedback, update details, and keep every review organized.</p>
            <div className="d-flex flex-wrap gap-2 mt-4">
              <button className="btn btn-primary btn-lg" onClick={startAdd}><i className="bi bi-plus-circle me-2" />Add a review</button>
              <a className="btn btn-light btn-lg hero-secondary" href="#reviews"><i className="bi bi-arrow-down-circle me-2" />Browse reviews</a>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-circle circle-one" /><div className="art-circle circle-two" />
            <div className="review-illustration"><i className="bi bi-chat-square-heart-fill" /><div className="illustration-stars">★★★★★</div><span>YOUR VOICE MATTERS</span></div>
            <div className="floating-note note-one"><i className="bi bi-check-circle-fill" /> Feedback saved</div>
            <div className="floating-note note-two"><i className="bi bi-star-fill" /> 5-star experience</div>
          </div>
        </section>

        {notice && <div className="alert alert-success alert-dismissible fade show mt-4" role="status"><i className="bi bi-check-circle-fill me-2" />{notice}<button className="btn-close" onClick={() => setNotice('')} aria-label="Dismiss" /></div>}
        {error && <div className="alert alert-danger alert-dismissible fade show mt-4" role="alert"><i className="bi bi-exclamation-triangle-fill me-2" />{error}<button className="btn-close" onClick={() => setError('')} aria-label="Dismiss" /></div>}

        <section className="stats-grid mt-4 mt-lg-5" aria-label="Review statistics">
          <div className="stat-card stat-blue"><div className="stat-icon"><i className="bi bi-chat-left-text" /></div><div><div className="stat-label">Total reviews</div><div className="stat-number">{stats.count}</div></div><span className="stat-decoration">01</span></div>
          <div className="stat-card stat-gold"><div className="stat-icon"><i className="bi bi-star-fill" /></div><div><div className="stat-label">Average rating</div><div className="stat-number">{stats.average}<small>/ 5</small></div></div><span className="stat-decoration">02</span></div>
          <div className="stat-card stat-green"><div className="stat-icon"><i className="bi bi-emoji-smile" /></div><div><div className="stat-label">5-star reviews</div><div className="stat-number">{stats.five}</div></div><span className="stat-decoration">03</span></div>
          <div className="stat-card stat-coral"><div className="stat-icon"><i className="bi bi-chat-square-dots" /></div><div><div className="stat-label">Needs attention</div><div className="stat-number">{stats.low}</div></div><span className="stat-decoration">04</span></div>
        </section>

        {showForm && <section className="form-panel mt-4" id="review-form">
          <div className="section-heading form-heading">
            <div><div className="eyebrow">{editingId !== null ? 'MAKE AN UPDATE' : 'SHARE YOUR EXPERIENCE'}</div><h2>{editingId !== null ? 'Edit review' : 'Add a restaurant review'}</h2><p>{editingId !== null ? `You are editing review #${editingId}.` : 'Tell us about the experience. All fields are required.'}</p></div>
            <button className="btn btn-icon" onClick={closeForm} aria-label="Close form"><i className="bi bi-x-lg" /></button>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="reviewerName">Reviewer name <span className="required">*</span></label>
                <input id="reviewerName" className={`form-control ${formErrors.reviewerName ? 'is-invalid' : ''}`} value={form.reviewerName} onChange={e => setForm({ ...form, reviewerName: e.target.value })} placeholder="e.g. Jahnavi Sai" maxLength={60} />
                {formErrors.reviewerName && <div className="invalid-feedback">{formErrors.reviewerName}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="rating">Rating <span className="required">*</span></label>
                <select id="rating" className={`form-select ${formErrors.rating ? 'is-invalid' : ''}`} value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })}>
                  <option value="5">5 — Excellent</option><option value="4">4 — Very good</option><option value="3">3 — Good</option><option value="2">2 — Fair</option><option value="1">1 — Poor</option>
                </select>
                {formErrors.rating && <div className="invalid-feedback">{formErrors.rating}</div>}
              </div>
              <div className="col-12">
                <label className="form-label" htmlFor="comments">Comments <span className="required">*</span></label>
                <textarea id="comments" className={`form-control ${formErrors.comments ? 'is-invalid' : ''}`} rows="4" value={form.comments} onChange={e => setForm({ ...form, comments: e.target.value })} placeholder="What did you like? What could be better?" maxLength={1000} />
                <div className="d-flex justify-content-between"><div className="invalid-feedback d-block">{formErrors.comments || ''}</div><small className="text-muted">{form.comments.length}/1000</small></div>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="reviewDate">Review date <span className="required">*</span></label>
                <input id="reviewDate" type="date" className={`form-control ${formErrors.reviewDate ? 'is-invalid' : ''}`} value={form.reviewDate} max={new Date().toISOString().slice(0, 10)} onChange={e => setForm({ ...form, reviewDate: e.target.value })} />
                {formErrors.reviewDate && <div className="invalid-feedback">{formErrors.reviewDate}</div>}
              </div>
            </div>
            <div className="form-actions mt-4">
              <button type="button" className="btn btn-light border" onClick={closeForm}>Cancel</button>
              <button type="submit" className="btn btn-primary px-4" disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</> : <><i className={`bi ${editingId !== null ? 'bi-check2-circle' : 'bi-plus-circle'} me-2`} />{editingId !== null ? 'Save changes' : 'Add review'}</>}</button>
            </div>
          </form>
        </section>}

        <section className="reviews-section mt-4 mt-lg-5" id="reviews">
          <div className="section-heading">
            <div><div className="eyebrow">THE FEEDBACK BOARD</div><h2>Restaurant reviews <span className="count-pill">{reviews.length}</span></h2><p>Search, review, edit, or remove feedback.</p></div>
            <button className="btn btn-primary" onClick={startAdd}><i className="bi bi-plus-lg me-2" />Add review</button>
          </div>
          <div className="filter-bar">
            <div className="search-wrap"><i className="bi bi-search" /><input className="form-control" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by reviewer, comment, date or ID..." aria-label="Search reviews" /></div>
            <select className="form-select rating-filter" value={ratingFilter} onChange={e => setRatingFilter(e.target.value)} aria-label="Filter by rating"><option value="all">All ratings</option><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select>
            <button className="btn btn-outline-secondary refresh-btn" onClick={() => loadReviews()} disabled={loading} title="Refresh reviews"><i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`} /> <span className="d-none d-sm-inline ms-1">Refresh</span></button>
          </div>

          {loading ? <div className="loading-state"><span className="spinner-border text-primary" /><strong>Loading reviews...</strong><span>Fetching the latest feedback from your backend.</span></div>
          : error && reviews.length === 0 ? <div className="empty-state"><div className="empty-icon"><i className="bi bi-cloud-slash" /></div><h3>Couldn't load reviews</h3><p>Check that Spring Boot is running on port 8081 and the database connection is working.</p><button className="btn btn-primary" onClick={() => loadReviews()}><i className="bi bi-arrow-clockwise me-2" />Try again</button></div>
          : visibleReviews.length === 0 ? <div className="empty-state"><div className="empty-icon"><i className="bi bi-chat-square" /></div><h3>{reviews.length ? 'No matching reviews' : 'No reviews yet'}</h3><p>{reviews.length ? 'Try changing your search or rating filter.' : 'Be the first to share feedback and add a review.'}</p>{!reviews.length && <button className="btn btn-primary" onClick={startAdd}><i className="bi bi-plus-lg me-2" />Add first review</button>}</div>
          : <div className="review-table-wrap">
              <div className="table-responsive">
                <table className="table review-table align-middle mb-0">
                  <thead><tr><th scope="col">Review</th><th scope="col">Rating</th><th scope="col">Comments</th><th scope="col">Review date</th><th scope="col" className="text-end">Actions</th></tr></thead>
                  <tbody>{visibleReviews.map(review => <tr key={review.id}>
                    <td><div className="reviewer-cell"><div className="avatar">{String(review.reviewerName || '?').trim().charAt(0).toUpperCase()}</div><div><strong>{review.reviewerName || 'Anonymous'}</strong><small>Review ID #{review.id}</small></div></div></td>
                    <td><div><Stars rating={review.rating} /><small className="rating-number">{review.rating}/5</small></div></td>
                    <td><div className="comment-preview" title={review.comments}>{review.comments || 'No comment provided'}</div></td>
                    <td><span className="date-cell"><i className="bi bi-calendar3 me-2" />{review.reviewDate || '—'}</span></td>
                    <td><div className="action-buttons"><button className="btn btn-sm btn-edit" onClick={() => startEdit(review)} title={`Edit review ${review.id}`}><i className="bi bi-pencil-square me-1" /><span>Edit</span></button><button className="btn btn-sm btn-delete" onClick={() => setDeleteTarget(review)} title={`Delete review ${review.id}`}><i className="bi bi-trash3 me-1" /><span>Delete</span></button></div></td>
                  </tr>)}</tbody>
                </table>
              </div>
              <div className="table-footer"><span>Showing <strong>{visibleReviews.length}</strong> of <strong>{reviews.length}</strong> reviews</span><span><i className="bi bi-shield-check me-1" />Changes sync with your backend</span></div>
            </div>}
        </section>
        <footer className="app-footer"><div className="footer-brand"><span className="brand-mark small-mark"><i className="bi bi-chat-square-heart-fill" /></span> ReviewTable</div><span>Restaurant Review Management · Spring Boot + React</span><a href="#home">Back to top <i className="bi bi-arrow-up" /></a></footer>
      </main>

      {deleteTarget && <div className="modal-backdrop-custom" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setDeleteTarget(null) }}>
        <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <div className="confirm-icon"><i className="bi bi-trash3" /></div>
          <h3 id="delete-title">Delete this review?</h3>
          <p>This will permanently delete review <strong>#{deleteTarget.id}</strong> by <strong>{deleteTarget.reviewerName}</strong>. This action cannot be undone.</p>
          <div className="d-flex gap-2 justify-content-center mt-4"><button className="btn btn-light border px-4" onClick={() => setDeleteTarget(null)}>Cancel</button><button className="btn btn-danger px-4" onClick={handleDelete}><i className="bi bi-trash3 me-2" />Delete review</button></div>
        </div>
      </div>}
    </div>
  )
}

export default App
