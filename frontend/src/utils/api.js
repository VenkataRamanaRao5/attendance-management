export const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token')
  options.headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  }

  const res = await fetch(url, options)

  // If unauthorized or forbidden, clear storage and redirect
  if (res.status === 401 || res.status === 403) {
    localStorage.clear()
    window.location.href = '/#/login'
  }

  return res
}
