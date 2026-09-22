import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export async function fetchAll(resource) {
  const res = await api.get(`/${resource}`)
  return res.data
}

export async function fetchById(resource, id) {
  const res = await api.get(`/${resource}/${id}`)
  return res.data
}

export async function create(resource, data) {
  const res = await api.post(`/${resource}`, data)
  return res.data
}

export async function update(resource, id, data) {
  const res = await api.put(`/${resource}/${id}`, data)
  return res.data
}

export async function remove(resource, id) {
  const res = await api.delete(`/${resource}/${id}`)
  return res.data
}

export default api
