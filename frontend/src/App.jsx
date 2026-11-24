import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiRequest } from './api.js'
import {
  ArrowDownWideNarrow,
  ArrowRight,
  ArrowUpRight,
  BookMarked,
  Bookmark,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Command,
  Compass,
  FileText,
  Filter,
  Folder,
  Globe2,
  Heart,
  Layers3,
  LayoutDashboard,
  Link2,
  LogOut,
  Moon,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Sparkles,
  Sun,
  Tag,
  Trash2,
  UserRound,
  Video,
  X,
} from 'lucide-react'

const initialBookmarks = [
  {
    id: 'b1',
    title: 'The ultimate guide to CSS Grid',
    url: 'https://css-tricks.com/snippets/css/complete-guide-grid/',
    description: 'A comprehensive guide to the powerful two-dimensional layout system in CSS.',
    category: 'Development',
    tags: ['CSS', 'Frontend'],
    type: 'Article',
    date: '2026-11-03',
    color: 'lavender',
    favorite: true,
    note: 'Revisit the section about auto-fit and minmax.',
  },
  {
    id: 'b2',
    title: 'Building a second brain',
    url: 'https://fortelabs.com/blog/basboverview/',
    description: 'A trusted system for capturing, organizing and sharing ideas.',
    category: 'Productivity',
    tags: ['Knowledge', 'Notes'],
    type: 'Article',
    date: '2026-11-02',
    color: 'peach',
    favorite: false,
    note: '',
  },
  {
    id: 'b3',
    title: 'Designing for the web',
    url: 'https://web.dev/learn/design/',
    description: 'Learn the foundations of responsive, accessible web design.',
    category: 'Design',
    tags: ['UX', 'Web'],
    type: 'Course',
    date: '2026-11-01',
    color: 'mint',
    favorite: true,
    note: 'Good resource for the Collectly UI.',
  },
  {
    id: 'b4',
    title: 'How to take smart notes',
    url: 'https://zettelkasten.de/introduction/',
    description: 'An introduction to the Zettelkasten method and connected thinking.',
    category: 'Research',
    tags: ['Learning', 'Notes'],
    type: 'Website',
    date: '2026-10-30',
    color: 'blue',
    favorite: false,
    note: '',
  },
  {
    id: 'b5',
    title: 'The shape of design systems',
    url: 'https://www.figma.com/blog/design-systems/',
    description: 'A practical look at the decisions behind a durable design system.',
    category: 'Design',
    tags: ['Systems', 'UI'],
    type: 'Article',
    date: '2026-10-28',
    color: 'rose',
    favorite: false,
    note: '',
  },
  {
    id: 'b6',
    title: 'React patterns to know',
    url: 'https://www.patterns.dev/react/',
    description: 'Patterns and concepts for creating maintainable React applications.',
    category: 'Development',
    tags: ['React', 'Frontend'],
    type: 'Documentation',
    date: '2026-10-27',
    color: 'yellow',
    favorite: false,
    note: '',
  },
]

const initialCollections = [
  {
    id: 'c1',
    name: 'Frontend inspiration',
    description: 'Ideas and resources for building thoughtful interfaces.',
    emoji: '🎨',
    color: 'collection-lilac',
    bookmarkIds: ['b1', 'b3', 'b5'],
  },
  {
    id: 'c2',
    name: 'Learning to learn',
    description: 'Notes on learning, focus and personal knowledge.',
    emoji: '🌱',
    color: 'collection-green',
    bookmarkIds: ['b2', 'b4'],
  },
  {
    id: 'c3',
    name: 'Build better things',
    description: 'Practical guides for the workbench.',
    emoji: '🛠️',
    color: 'collection-peach',
    bookmarkIds: ['b6'],
  },
]

const starterCategories = [
  { name: 'Development', color: '#7a80c5', icon: '◈' },
  { name: 'Design', color: '#db8c70', icon: '✳' },
  { name: 'Productivity', color: '#67a48a', icon: '✦' },
  { name: 'Research', color: '#5f91bd', icon: '⌕' },
]

const icons = {
  Development: '◈',
  Design: '✳',
  Productivity: '✦',
  Research: '⌕',
  Learning: '◌',
  Inspiration: '✷',
}
const storage = {
  read(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(`collectly-${key}`)) ?? fallback
    } catch {
      return fallback
    }
  },
  write(key, value) {
    localStorage.setItem(`collectly-${key}`, JSON.stringify(value))
  },
}

function useStoredState(key, fallback) {
  const [value, setValue] = useState(() => storage.read(key, fallback))
  useEffect(() => storage.write(key, value), [key, value])
  return [value, setValue]
}

function routeState(path) {
  const parts = path
    .split('/')
    .filter(Boolean)
    .map((part) => decodeURIComponent(part))
  if (parts[0] === 'categories' && parts[1]) return { active: 'category', value: parts[1] }
  if (parts[0] === 'collections' && parts[1]) return { active: 'collection', value: parts[1] }
  return {
    active: ['bookmarks', 'favorites', 'collections', 'categories', 'settings'].includes(parts[0])
      ? parts[0]
      : 'dashboard',
    value: null,
  }
}

function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'saved link'
  }
}

function userFromApi(profile) {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.display_name || profile.email.split('@')[0],
    emailVerified: profile.email_verified,
  }
}

function bookmarkFromApi(bookmark) {
  return {
    id: bookmark.id,
    title: bookmark.title,
    url: bookmark.url,
    description: bookmark.description || '',
    category: bookmark.category || 'Uncategorized',
    tags: bookmark.tag_names || [],
    type: bookmark.content_type || 'Website',
    date: bookmark.created_at?.slice(0, 10) || '',
    favorite: bookmark.is_favorite,
    note: bookmark.personal_note || '',
    collectionIds: bookmark.collection_ids || [],
  }
}

function libraryFromApi(bookmarkPage, categories, collections) {
  return {
    bookmarks: bookmarkPage.items.map(bookmarkFromApi),
    bookmarkTotal: bookmarkPage.total,
    categories,
    collections: collections.map((collection) => ({
      ...collection,
      bookmarkIds: collection.bookmark_ids,
    })),
  }
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('collectly-token'))
  const [authLoading, setAuthLoading] = useState(true)
  const [theme, setTheme] = useStoredState('theme', 'light')
  const [transitionTarget, setTransitionTarget] = useState(null)
  const transitionLock = useRef(false)
  const [bookmarks, setBookmarks] = useState([])
  const [bookmarkTotal, setBookmarkTotal] = useState(0)
  const [collections, setCollections] = useState([])
  const [categories, setCategories] = useState([])
  const [active, setActive] = useState(() => routeState(location.pathname).active)
  const [activeCollection, setActiveCollection] = useState(
    () => routeState(location.pathname).value,
  )
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState('')

  const loadLibrary = async (sessionToken) => {
    const [bookmarkPage, categoryRows, collectionRows] = await Promise.all([
      apiRequest('/bookmarks?page=1&page_size=100', { token: sessionToken }),
      apiRequest('/categories', { token: sessionToken }),
      apiRequest('/collections', { token: sessionToken }),
    ])
    return libraryFromApi(bookmarkPage, categoryRows, collectionRows)
  }

  const applyLibrary = (library) => {
    setBookmarks(library.bookmarks)
    setBookmarkTotal(library.bookmarkTotal)
    setCategories(library.categories)
    setCollections(library.collections)
  }

  useEffect(() => {
    let activeRequest = true
    if (!token) {
      setAuthLoading(false)
      return () => {
        activeRequest = false
      }
    }

    const restoreSession = async () => {
      try {
        const profile = await apiRequest('/users/me', { token })
        const library = await loadLibrary(token)
        if (!activeRequest) return
        setUser(userFromApi(profile))
        applyLibrary(library)
      } catch {
        localStorage.removeItem('collectly-token')
        if (activeRequest) {
          setToken(null)
          setUser(null)
          setBookmarks([])
          setBookmarkTotal(0)
          setCategories([])
          setCollections([])
        }
      } finally {
        if (activeRequest) setAuthLoading(false)
      }
    }

    restoreSession()
    return () => {
      activeRequest = false
    }
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
  const toggleTheme = () => {
    if (transitionLock.current) return
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTheme(nextTheme)
      return
    }
    transitionLock.current = true
    setTransitionTarget(nextTheme)
    window.setTimeout(() => setTheme(nextTheme), 1500)
    window.setTimeout(() => {
      setTransitionTarget(null)
      transitionLock.current = false
    }, 3250)
  }

  const notify = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }
  const visibleBookmarks = useMemo(() => {
    let items = [...bookmarks]
    if (active === 'favorites') items = items.filter((item) => item.favorite)
    if (active === 'category') items = items.filter((item) => item.category === activeCollection)
    if (active === 'collection' && activeCollection) {
      const collection = collections.find((item) => item.id === activeCollection)
      items = items.filter((item) => collection?.bookmarkIds.includes(item.id))
    }
    const query = search.trim().toLowerCase()
    if (query)
      items = items.filter((item) =>
        [item.title, item.description, item.url, item.note, item.category, ...item.tags]
          .join(' ')
          .toLowerCase()
          .includes(query),
      )
    return items
  }, [bookmarks, active, activeCollection, collections, search])

  useEffect(() => {
    const route = routeState(location.pathname)
    setActive(route.active)
    setActiveCollection(route.value)
  }, [location.pathname])
  const go = (name, value = null) => {
    setSearch('')
    const path =
      name === 'dashboard'
        ? '/'
        : name === 'category'
          ? `/categories/${encodeURIComponent(value)}`
          : name === 'collection'
            ? `/collections/${value}`
            : `/${name}`
    navigate(path)
  }
  const refreshLibrary = async () => applyLibrary(await loadLibrary(token))

  const authenticate = async ({ mode, name, email, password, passwordConfirmation }) => {
    if (mode === 'register') {
      await apiRequest('/auth/register', {
        method: 'POST',
        body: {
          email,
          password,
          password_confirmation: passwordConfirmation,
          display_name: name,
        },
      })
    }
    const tokenResponse = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    localStorage.setItem('collectly-token', tokenResponse.access_token)
    setToken(tokenResponse.access_token)
    const [profile, library] = await Promise.all([
      apiRequest('/users/me', { token: tokenResponse.access_token }),
      loadLibrary(tokenResponse.access_token),
    ])
    setUser(userFromApi(profile))
    applyLibrary(library)
    setAuthLoading(false)
    go('dashboard')
  }

  const logout = () => {
    localStorage.removeItem('collectly-token')
    localStorage.removeItem('collectly-user')
    setToken(null)
    setUser(null)
    setBookmarks([])
    setBookmarkTotal(0)
    setCategories([])
    setCollections([])
    go('dashboard')
  }

  const addBookmark = async (item) => {
    const category = categories.find((entry) => entry.name === item.category)
    const payload = {
      url: item.url,
      title: item.title,
      description: item.description || '',
      category_id: category?.id || null,
      tag_names: item.tags || [],
      content_type: item.type || 'Website',
      personal_note: item.note || '',
      is_favorite: Boolean(item.favorite),
      collection_ids: item.collectionIds || [],
    }
    try {
      await apiRequest(item.id ? `/bookmarks/${item.id}` : '/bookmarks', {
        token,
        method: item.id ? 'PATCH' : 'POST',
        body: payload,
      })
      await refreshLibrary()
      setModal(null)
      notify(item.id ? 'Bookmark updated' : 'Bookmark saved to your library')
    } catch (error) {
      notify(error.message)
    }
  }

  const removeBookmark = async (id) => {
    try {
      await apiRequest(`/bookmarks/${id}`, { token, method: 'DELETE' })
      await refreshLibrary()
      setModal(null)
      notify('Bookmark deleted')
    } catch (error) {
      notify(error.message)
    }
  }

  const toggleFavorite = async (id) => {
    const bookmark = bookmarks.find((item) => item.id === id)
    if (!bookmark) return
    try {
      await apiRequest(`/bookmarks/${id}`, {
        token,
        method: 'PATCH',
        body: { is_favorite: !bookmark.favorite },
      })
      await refreshLibrary()
    } catch (error) {
      notify(error.message)
    }
  }

  const addCollection = async (collection) => {
    try {
      await apiRequest('/collections', { token, method: 'POST', body: collection })
      await refreshLibrary()
      setModal(null)
      notify('Collection created')
    } catch (error) {
      notify(error.message)
    }
  }

  const removeCollection = async (collection) => {
    try {
      await apiRequest(`/collections/${collection.id}`, { token, method: 'DELETE' })
      await refreshLibrary()
      setModal(null)
      go('collections')
      notify('Collection deleted')
    } catch (error) {
      notify(error.message)
    }
  }

  const addCategory = async (category) => {
    try {
      await apiRequest('/categories', { token, method: 'POST', body: category })
      await refreshLibrary()
      setModal(null)
      notify('Category created')
    } catch (error) {
      notify(error.message)
    }
  }

  const removeCategory = async (category) => {
    try {
      await apiRequest(`/categories/${category.id}`, { token, method: 'DELETE' })
      await refreshLibrary()
      setModal(null)
      go('categories')
      notify('Category deleted')
    } catch (error) {
      notify(error.message)
    }
  }

  const saveProfile = async (name) => {
    try {
      const profile = await apiRequest('/users/me', {
        token,
        method: 'PATCH',
        body: { display_name: name },
      })
      setUser(userFromApi(profile))
      notify('Profile updated')
    } catch (error) {
      notify(error.message)
    }
  }

  if (authLoading)
    return <div className="app-loading">Loading your Collectly library…</div>

  if (!user)
    return (
      <AuthScreen
        theme={theme}
        toggleTheme={toggleTheme}
        transitionTarget={transitionTarget}
        onLogin={authenticate}
      />
    )

  const pageTitle =
    active === 'dashboard'
      ? 'Your library'
      : active === 'bookmarks'
        ? 'All bookmarks'
        : active === 'favorites'
          ? 'Favorites'
          : active === 'collections'
            ? 'Collections'
            : active === 'categories'
              ? 'Categories'
              : active === 'settings'
                ? 'Settings'
                : active === 'category'
                  ? activeCollection
                  : active === 'collection'
                    ? (collections.find((item) => item.id === activeCollection)?.name ??
                      'Collection')
                    : 'Your library'

  return (
    <div className={`app-shell ${theme === 'dark' ? 'theme-dark' : ''}`}>
      <Sidebar
        active={active}
        go={go}
        categories={categories}
        collections={collections}
        bookmarks={bookmarks}
        user={user}
        onLogout={logout}
        openCreate={() => setModal({ type: 'bookmark' })}
        onAddCategory={() => setModal({ type: 'category' })}
        onAddCollection={() => setModal({ type: 'collection' })}
        bookmarkCount={bookmarkTotal}
      />
      <main className="main-area">
        <header className="topbar">
          <div className="topbar-actions">
            <label className="search-box">
              <Search size={16} />
              <input
                aria-label="Search your library"
                placeholder="Search anything..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <kbd>
                <Command size={11} /> K
              </kbd>
            </label>
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              className="button button-primary top-add"
              onClick={() => setModal({ type: 'bookmark' })}
            >
              <Plus size={16} /> Add bookmark
            </button>
            <button
              className="avatar avatar-small"
              aria-label="Open profile"
              onClick={() => go('settings')}
            >
              {user.name?.slice(0, 1).toUpperCase() || 'A'}
            </button>
          </div>
        </header>
        <div className="page-content">
          {active === 'dashboard' && (
            <Dashboard
              user={user}
              bookmarks={bookmarks}
              categories={categories}
              collections={collections}
              go={go}
              openBookmark={(bookmark) => setModal({ type: 'bookmark', bookmark })}
              toggleFavorite={toggleFavorite}
            />
          )}
          {['bookmarks', 'favorites', 'category', 'collection'].includes(active) && (
            <BookmarkPage
              title={pageTitle}
              active={active}
              bookmarks={visibleBookmarks}
              categories={categories}
              search={search}
              openCreate={() => setModal({ type: 'bookmark' })}
              openEdit={(bookmark) => setModal({ type: 'bookmark', bookmark })}
              removeBookmark={(bookmark) => setModal({ type: 'confirm-delete', bookmark })}
              removeCollection={
                active === 'collection'
                  ? () => {
                      const collection = collections.find((item) => item.id === activeCollection)
                      if (collection) setModal({ type: 'confirm-delete-collection', collection })
                    }
                  : null
              }
              removeCategory={
                active === 'category'
                  ? () => {
                      const category = categories.find((item) => item.name === activeCollection)
                      if (category) setModal({ type: 'confirm-delete-category', category })
                    }
                  : null
              }
              toggleFavorite={toggleFavorite}
            />
          )}
          {active === 'collections' && (
            <CollectionsPage
              collections={collections}
              bookmarks={bookmarks}
              onCreate={() => setModal({ type: 'collection' })}
              openCollection={(id) => go('collection', id)}
            />
          )}
          {active === 'categories' && (
            <CategoriesPage
              categories={categories}
              bookmarks={bookmarks}
              onCreate={() => setModal({ type: 'category' })}
              openCategory={(name) => go('category', name)}
            />
          )}
          {active === 'settings' && (
            <SettingsPage
              user={user}
              onSave={saveProfile}
              onLogout={logout}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          )}
        </div>
      </main>
      {modal?.type === 'bookmark' && (
        <BookmarkModal
          bookmark={modal.bookmark}
          categories={categories}
          collections={collections}
          onClose={() => setModal(null)}
          onSave={addBookmark}
        />
      )}
      {modal?.type === 'collection' && (
        <CollectionModal onClose={() => setModal(null)} onSave={addCollection} />
      )}
      {modal?.type === 'category' && (
        <CategoryModal onClose={() => setModal(null)} onSave={addCategory} />
      )}
      {modal?.type === 'confirm-delete' && (
        <ConfirmModal
          bookmark={modal.bookmark}
          onClose={() => setModal(null)}
          onConfirm={() => removeBookmark(modal.bookmark.id)}
        />
      )}
      {modal?.type === 'confirm-delete-collection' && (
        <ConfirmCollectionModal
          collection={modal.collection}
          onClose={() => setModal(null)}
          onConfirm={() => removeCollection(modal.collection)}
        />
      )}
      {modal?.type === 'confirm-delete-category' && (
        <ConfirmCategoryModal
          category={modal.category}
          onClose={() => setModal(null)}
          onConfirm={() => removeCategory(modal.category)}
        />
      )}
      {toast && (
        <div className="toast">
          <span className="toast-check">
            <Check size={14} />
          </span>
          {toast}
        </div>
      )}
      {transitionTarget && <ThemeTransition targetTheme={transitionTarget} />}
      <MobileBottomNav active={active} go={go} />
    </div>
  )
}

function ThemeTransition({ targetTheme }) {
  return (
    <div className={`theme-transition theme-transition-${targetTheme}`} aria-hidden="true">
      <div className="curtain-panel curtain-left" />
      <div className="curtain-panel curtain-right" />
      <div className="transition-center">
        <span className="transition-icon">
          {targetTheme === 'dark' ? <Moon size={22} fill="currentColor" /> : <Sun size={23} />}
        </span>
        <span>{targetTheme === 'dark' ? 'a little moonlight' : 'hello, morning'}</span>
      </div>
    </div>
  )
}

function InteractiveSculpture() {
  const sculpture = useRef(null)

  const followPointer = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return
    const x = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2))
    const y = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2))
    sculpture.current?.style.setProperty('--tilt-x', `${-y * 16}deg`)
    sculpture.current?.style.setProperty('--tilt-y', `${x * 20}deg`)
    sculpture.current?.style.setProperty('--shine-x', `${35 + x * 24}%`)
    sculpture.current?.style.setProperty('--shine-y', `${24 + y * 18}%`)
    sculpture.current?.style.setProperty('--eye-x', `${x * 7}px`)
    sculpture.current?.style.setProperty('--eye-y', `${y * 6}px`)
  }

  const resetSculpture = () => {
    sculpture.current?.style.setProperty('--tilt-x', '0deg')
    sculpture.current?.style.setProperty('--tilt-y', '0deg')
    sculpture.current?.style.setProperty('--shine-x', '35%')
    sculpture.current?.style.setProperty('--shine-y', '24%')
    sculpture.current?.style.setProperty('--eye-x', '0px')
    sculpture.current?.style.setProperty('--eye-y', '0px')
  }

  useEffect(() => {
    const pointerArea = sculpture.current?.closest('.auth-left, .auth-mobile-sculpture')
    if (!pointerArea) return undefined
    pointerArea.addEventListener('pointermove', followPointer)
    pointerArea.addEventListener('pointerleave', resetSculpture)
    return () => {
      pointerArea.removeEventListener('pointermove', followPointer)
      pointerArea.removeEventListener('pointerleave', resetSculpture)
    }
  }, [])

  return (
    <div
      ref={sculpture}
      className="auth-sculpture"
      aria-hidden="true"
    >
      <div className="sculpture-glow" />
      <div className="sculpture-orbit orbit-back" />
      <div className="sculpture-orbit orbit-front" />
      <div className="buddy-float">
        <div className="idea-buddy">
          <span className="buddy-leaf" />
          <span className="buddy-eye eye-left" />
          <span className="buddy-eye eye-right" />
          <span className="buddy-cheek cheek-left" />
          <span className="buddy-cheek cheek-right" />
          <span className="buddy-smile" />
          <span className="buddy-shine" />
        </div>
      </div>
      <span className="sculpture-spark spark-top">✦</span>
      <span className="sculpture-spark spark-side">✧</span>
      <span className="sculpture-base" />
    </div>
  )
}

function Brand({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand-compact' : ''}`}>
      <span className="brand-mark">
        <Bookmark size={17} strokeWidth={2.5} />
      </span>
      <span>
        collectly<span className="brand-period">.</span>
      </span>
    </div>
  )
}

function Sidebar({
  active,
  go,
  categories,
  collections,
  bookmarks,
  user,
  onLogout,
  openCreate,
  onAddCategory,
  onAddCollection,
  bookmarkCount,
}) {
  const location = useLocation()
  const storageCapacity = 5000
  const storagePercent =
    bookmarkCount > 0
      ? Math.min(100, Math.max(1, Math.ceil((bookmarkCount / storageCapacity) * 100)))
      : 0
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const workspaceRef = useRef(null)
  const workspaceName = user?.name?.trim() || user?.email?.split('@')[0] || 'Personal'
  const workspaceTitle = `${workspaceName}’s space`

  useEffect(() => {
    if (!workspaceOpen) return undefined
    const closeOnOutsideClick = (event) => {
      if (!workspaceRef.current?.contains(event.target)) setWorkspaceOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setWorkspaceOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [workspaceOpen])

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <Brand />
        <div className="workspace-picker" ref={workspaceRef}>
          <button
            className="workspace-switch"
            type="button"
            aria-haspopup="menu"
            aria-expanded={workspaceOpen}
            onClick={() => setWorkspaceOpen((open) => !open)}
          >
            <span className="workspace-dot">{workspaceName.slice(0, 1).toUpperCase()}</span>
            <span>
              <strong>{workspaceTitle}</strong>
              <small>Personal workspace</small>
            </span>
            <ChevronDown className={workspaceOpen ? 'workspace-chevron open' : 'workspace-chevron'} size={15} />
          </button>
          {workspaceOpen && (
            <div className="workspace-menu" role="menu" aria-label="Personal workspace">
              <p className="workspace-menu-label">CURRENT WORKSPACE</p>
              <button
                className="workspace-menu-current"
                type="button"
                role="menuitemradio"
                aria-checked="true"
                onClick={() => {
                  setWorkspaceOpen(false)
                  go('dashboard')
                }}
              >
                <span className="workspace-menu-dot">{workspaceName.slice(0, 1).toUpperCase()}</span>
                <span className="workspace-menu-copy">
                  <strong>{workspaceTitle}</strong>
                  <small>Personal workspace</small>
                </span>
                <Check size={15} />
              </button>
              <div className="workspace-menu-divider" />
              <button
                className="workspace-menu-settings"
                type="button"
                role="menuitem"
                onClick={() => {
                  setWorkspaceOpen(false)
                  go('settings')
                }}
              >
                <Settings size={15} />
                Manage profile
              </button>
            </div>
          )}
        </div>
      </div>
      <button className="quick-add-side" onClick={openCreate}>
        <span>
          <Plus size={16} />
        </span>
        Save a link<kbd>⌘ K</kbd>
      </button>
      <div className="nav-group">
        <p className="nav-label">WORKSPACE</p>
        <NavItem
          icon={<LayoutDashboard />}
          label="Overview"
          active={active === 'dashboard'}
          onClick={() => go('dashboard')}
        />
        <NavItem
          icon={<BookMarked />}
          label="All bookmarks"
          count={bookmarkCount}
          active={['bookmarks', 'category', 'collection'].includes(active)}
          onClick={() => go('bookmarks')}
        />
        <NavItem
          icon={<Heart />}
          label="Favorites"
          count={bookmarks.filter((item) => item.favorite).length}
          active={active === 'favorites'}
          onClick={() => go('favorites')}
        />
        <NavItem
          icon={<Folder />}
          label="Collections"
          active={active === 'collections'}
          onClick={() => go('collections')}
        />
      </div>
      <div className="nav-group category-nav">
        <div className="nav-label-row">
          <p className="nav-label">CATEGORIES</p>
          <button className="tiny-icon" aria-label="Add category" onClick={onAddCategory}>
            <Plus size={15} />
          </button>
        </div>
        {categories.slice(0, 5).map((category) => (
          <button
            key={category.name}
            className={`nav-item ${active === 'category' && category.name === window.decodeURIComponent(location.pathname.split('/').pop()) ? 'selected' : ''}`}
            onClick={() => go('category', category.name)}
          >
            <span className="category-icon" style={{ color: category.color }}>
              {category.icon || icons[category.name] || '◈'}
            </span>
            <span className="nav-item-label">{category.name}</span>
            <span className="nav-count">
              {bookmarks.filter((item) => item.category === category.name).length}
            </span>
          </button>
        ))}
        {categories.length > 5 && (
          <button className="nav-item nav-muted" onClick={() => go('categories')}>
            <span className="category-icon">
              <MoreHorizontal size={15} />
            </span>
            <span className="nav-item-label">More categories</span>
          </button>
        )}
      </div>
      <div className="nav-group collection-nav">
        <div className="nav-label-row">
          <p className="nav-label">YOUR COLLECTIONS</p>
          <button className="tiny-icon" aria-label="Add collection" onClick={onAddCollection}>
            <Plus size={15} />
          </button>
        </div>
        {collections.slice(0, 3).map((collection) => (
          <button
            key={collection.id}
            className={`nav-item ${active === 'collection' && location.pathname.split('/').pop() === collection.id ? 'selected' : ''}`}
            onClick={() => go('collection', collection.id)}
          >
            <span className="collection-icon-small">{collection.emoji}</span>
            <span className="nav-item-label">{collection.name}</span>
          </button>
        ))}
        <button className="nav-item nav-muted" onClick={() => go('collections')}>
          <span className="category-icon">
            <Plus size={15} />
          </span>
          <span className="nav-item-label">Browse collections</span>
        </button>
      </div>
      <div className="sidebar-bottom">
        <div className="storage-card">
          <div className="storage-head">
            <span>Library storage</span>
            <span>{storagePercent}%</span>
          </div>
          <div className="storage-track">
            <span style={{ width: `${storagePercent}%` }} />
          </div>
          <small>
            {bookmarkCount.toLocaleString()} of {storageCapacity.toLocaleString()} saved items
          </small>
        </div>
        <NavItem
          icon={<CircleHelp />}
          label="Help & feedback"
          onClick={() => window.open('mailto:hello@collectly.app')}
        />
        <NavItem
          icon={<Settings />}
          label="Settings"
          active={active === 'settings'}
          onClick={() => go('settings')}
        />
        <div className="sidebar-user">
          <div className="avatar">{user.name?.slice(0, 1).toUpperCase() || 'A'}</div>
          <span className="user-copy">
            <strong>{user.name || 'Alex Morgan'}</strong>
            <small>Personal plan</small>
          </span>
          <button className="tiny-icon logout-button" onClick={onLogout} title="Log out">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}

function NavItem({ icon, label, count, active, onClick }) {
  return (
    <button className={`nav-item ${active ? 'selected' : ''}`} onClick={onClick}>
      {icon}
      <span className="nav-item-label">{label}</span>
      {count && <span className="nav-count">{count}</span>}
    </button>
  )
}

function MobileBottomNav({ active, go }) {
  const items = [
    { key: 'dashboard', label: 'Home', icon: <LayoutDashboard size={19} /> },
    {
      key: 'bookmarks',
      label: 'Library',
      icon: <Bookmark size={19} />,
      selected: ['bookmarks', 'favorites', 'category'].includes(active),
    },
    {
      key: 'collections',
      label: 'Collections',
      icon: <Folder size={19} />,
      selected: ['collections', 'collection'].includes(active),
    },
    { key: 'categories', label: 'Categories', icon: <Tag size={19} /> },
    { key: 'settings', label: 'Settings', icon: <Settings size={19} /> },
  ]

  return (
    <nav className="mobile-bottom-nav" aria-label="Main navigation">
      {items.map((item) => {
        const selected = item.selected ?? active === item.key
        return (
          <button
            key={item.key}
            type="button"
            className={`mobile-bottom-nav-item ${selected ? 'selected' : ''}`}
            aria-current={selected ? 'page' : undefined}
            onClick={() => go(item.key)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

function PageHeading({
  eyebrow,
  title,
  subtitle,
  action,
  actionLabel,
  actionIcon = <Plus size={16} />,
  secondaryAction,
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="page-heading-actions">
        {secondaryAction}
        {action && (
          <button className="button button-primary" onClick={action}>
            {actionIcon}
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}

function StyledDropdown({ value, options, onChange, ariaLabel, className = '' }) {
  const [open, setOpen] = useState(false)
  const container = useRef(null)
  const trigger = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const closeOnOutsideClick = (event) => {
      if (!container.current?.contains(event.target)) setOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        trigger.current?.focus()
      }
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const moveFocus = (event) => {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return
    event.preventDefault()
    const choices = [...container.current.querySelectorAll('[role="option"]')]
    const current = choices.indexOf(document.activeElement)
    const direction = event.key === 'ArrowDown' ? 1 : -1
    choices[(current + direction + choices.length) % choices.length]?.focus()
  }

  return (
    <div className={`styled-dropdown ${className}`} ref={container}>
      <button
        ref={trigger}
        type="button"
        className="dropdown-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{value}</span>
        <ChevronDown size={14} className={open ? 'dropdown-chevron open' : 'dropdown-chevron'} />
      </button>
      {open && (
        <div className="dropdown-menu" role="listbox" aria-label={ariaLabel} onKeyDown={moveFocus}>
          {options.map((option) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={value === option}
              className={`dropdown-option ${value === option ? 'selected' : ''}`}
              onClick={() => {
                onChange(option)
                setOpen(false)
                trigger.current?.focus()
              }}
            >
              <span>{option}</span>
              {value === option && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Dashboard({ user, bookmarks, categories, collections, go, openBookmark, toggleFavorite }) {
  const recent = [...bookmarks].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4)
  return (
    <>
      <div className="welcome-banner">
        <div className="welcome-copy">
          <div className="welcome-kicker">
            <Sparkles size={13} /> YOUR KNOWLEDGE, IN ONE PLACE
          </div>
          <h1>
            A little more organized.
            <br />
            <em>A lot more you.</em>
          </h1>
          <p>Good morning, {user.name}. Here’s what’s happening in your library.</p>
          <button className="welcome-action" onClick={() => go('bookmarks')}>
            Explore your library <ArrowRight size={15} />
          </button>
        </div>
        <div className="welcome-art">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-star star-one">✳</div>
          <div className="art-star star-two">✦</div>
          <div className="art-stack">
            <div className="art-card art-card-back">
              <span>✷</span>
              <i />
            </div>
            <div className="art-card art-card-mid">
              <span>◈</span>
              <i />
              <i />
            </div>
            <div className="art-card art-card-front">
              <Bookmark size={18} fill="currentColor" />
              <strong>
                good ideas,
                <br />
                kept close.
              </strong>
              <small>your personal library</small>
            </div>
          </div>
          <div className="art-sparkle">✦</div>
        </div>
      </div>
      <div className="section-heading stats-heading">
        <div>
          <h2>Your library at a glance</h2>
          <p>Small steps add up to a thoughtful collection.</p>
        </div>
        <button className="text-action" onClick={() => go('bookmarks')}>
          View all activity <ArrowRight size={15} />
        </button>
      </div>
      <div className="stats-grid">
        <StatCard
          icon={<Bookmark />}
          label="Saved items"
          value={bookmarks.length}
          change="+4 this week"
          tone="purple"
          chart="▂▃▂▅▃▆▅"
        />
        <StatCard
          icon={<Folder />}
          label="Collections"
          value={collections.length}
          change="A place for everything"
          tone="peach"
          chart="▂▂▃▃▅▃▆"
        />
        <StatCard
          icon={<Heart />}
          label="Favorites"
          value={bookmarks.filter((item) => item.favorite).length}
          change="Your best of the best"
          tone="rose"
          chart="▂▃▃▂▅▆▅"
        />
        <StatCard
          icon={<Tag />}
          label="Categories"
          value={categories.length}
          change="Nicely sorted"
          tone="mint"
          chart="▃▂▅▃▃▅▆"
        />
      </div>
      <div className="dashboard-columns">
        <section className="panel recent-panel">
          <div className="panel-heading">
            <div>
              <h2>Recently saved</h2>
              <p>Pick up right where you left off.</p>
            </div>
            <button className="text-action" onClick={() => go('bookmarks')}>
              See all <ArrowRight size={15} />
            </button>
          </div>
          <div className="recent-list">
            {recent.map((item) => (
              <RecentRow key={item.id} item={item} open={() => openBookmark(item)} />
            ))}
          </div>
        </section>
        <section className="panel side-panel">
          <div className="panel-heading">
            <div>
              <h2>Made for your mind</h2>
              <p>Quick ways to keep things tidy.</p>
            </div>
            <span className="soft-sparkle">
              <Sparkles size={16} />
            </span>
          </div>
          <div className="tip-card">
            <div className="tip-illustration">
              <div className="tip-sheet">
                <span />
                <span />
                <span />
              </div>
              <div className="tip-tag">✦</div>
            </div>
            <div className="tip-copy">
              <strong>Give good ideas a home</strong>
              <p>Group related links into a collection so you can find them in a flash.</p>
              <button className="tip-link" onClick={() => go('collections')}>
                Explore collections <ArrowRight size={14} />
              </button>
            </div>
          </div>
          <div className="collection-mini">
            <div className="mini-title">
              YOUR COLLECTIONS{' '}
              <button className="text-action" onClick={() => go('collections')}>
                See all
              </button>
            </div>
            {collections.slice(0, 2).map((collection) => (
              <button
                key={collection.id}
                className="mini-collection"
                onClick={() => go('collection', collection.id)}
              >
                <span className={`mini-collection-icon ${collection.color}`}>
                  {collection.emoji}
                </span>
                <span>
                  <strong>{collection.name}</strong>
                  <small>{collection.bookmarkIds.length} items</small>
                </span>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
        </section>
      </div>
      <div className="bottom-note">
        <span className="note-flower">✳</span>
        <span>
          <strong>Curate a life you love.</strong> Your library is yours to shape — one good link at
          a time.
        </span>
        <button onClick={() => go('bookmarks')}>
          Browse bookmarks <ArrowRight size={14} />
        </button>
      </div>
    </>
  )
}

function StatCard({ icon, label, value, change, tone, chart }) {
  const barHeights = [10, 14, 11, 18, 13, 21, 17]
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className={`stat-icon ${tone}`}>{icon}</span>
        <span className="stat-chart">
          {chart.split('').map((_, i) => (
            <i key={i} style={{ height: `${barHeights[i % barHeights.length]}px` }} />
          ))}
        </span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-change">
        <span className="change-dot" />
        {change}
      </div>
    </div>
  )
}

function RecentRow({ item, open }) {
  return (
    <button className="recent-row" onClick={open}>
      <span className={`recent-thumb ${item.color}`}>
        {item.type === 'Course' ? (
          <Compass size={19} />
        ) : item.type === 'Documentation' ? (
          <FileText size={19} />
        ) : (
          <Globe2 size={19} />
        )}
      </span>
      <span className="recent-info">
        <strong>{item.title}</strong>
        <small>
          <span className="tiny-domain-mark">◉</span>
          {domainOf(item.url)} <i>·</i> {item.category}
        </small>
      </span>
      <span className="recent-date">{formatDate(item.date)}</span>
      <ArrowUpRight className="recent-arrow" size={15} />
    </button>
  )
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(
    new Date(`${date}T12:00:00`),
  )
}

function BookmarkPage({
  title,
  active,
  bookmarks,
  categories,
  search,
  openCreate,
  openEdit,
  removeBookmark,
  removeCollection,
  removeCategory,
  toggleFavorite,
}) {
  const [view, setView] = useState('grid')
  const [filter, setFilter] = useState('All types')
  const [sort, setSort] = useState('Newest first')
  const items = useMemo(() => {
    let result =
      filter === 'All types' ? [...bookmarks] : bookmarks.filter((item) => item.type === filter)
    if (sort === 'Oldest first') result.reverse()
    if (sort === 'Title A–Z') result.sort((a, b) => a.title.localeCompare(b.title))
    return result
  }, [bookmarks, filter, sort])
  const subtitle =
    active === 'favorites'
      ? 'All the little things you want to come back to.'
      : active === 'category'
        ? `A thoughtful corner for ${title.toLowerCase()}.`
        : active === 'collection'
          ? 'Everything you gathered in one place.'
          : 'Every useful thing you’ve found on the internet.'
  return (
    <>
      <PageHeading
        eyebrow={
          active === 'favorites'
            ? 'THE GOOD STUFF'
            : active === 'collection'
              ? 'YOUR COLLECTION'
              : 'YOUR LIBRARY'
        }
        title={title}
        subtitle={subtitle}
        secondaryAction={
          removeCollection ? (
            <button
              className="button button-outline collection-delete-action"
              type="button"
              onClick={removeCollection}
            >
              <Trash2 size={15} />
              Delete collection
            </button>
          ) : removeCategory ? (
            <button
              className="button button-outline collection-delete-action"
              type="button"
              onClick={removeCategory}
            >
              <Trash2 size={15} />
              Delete category
            </button>
          ) : null
        }
        action={openCreate}
        actionLabel="Add bookmark"
      />
      <div className="bookmark-toolbar">
        <div className="toolbar-left">
          <span className="results-count">
            <strong>{items.length}</strong> {items.length === 1 ? 'bookmark' : 'bookmarks'}
          </span>
          <span className="toolbar-divider" />
          <div className="select-wrap">
            <Filter size={14} />
            <StyledDropdown
              value={filter}
              options={['All types', 'Article', 'Website', 'Course', 'Documentation', 'Video']}
              onChange={setFilter}
              ariaLabel="Filter by content type"
              className="toolbar-dropdown"
            />
          </div>
          <div className="select-wrap sort-select">
            <ArrowDownWideNarrow size={14} />
            <StyledDropdown
              value={sort}
              options={['Newest first', 'Oldest first', 'Title A–Z']}
              onChange={setSort}
              ariaLabel="Sort bookmarks"
              className="toolbar-dropdown"
            />
          </div>
        </div>
        <div className="view-switch">
          <button
            className={view === 'grid' ? 'active' : ''}
            onClick={() => setView('grid')}
            aria-label="Grid view"
          >
            <span className="grid-glyph">▦</span>
          </button>
          <button
            className={view === 'list' ? 'active' : ''}
            onClick={() => setView('list')}
            aria-label="List view"
          >
            <span className="list-glyph">☷</span>
          </button>
        </div>
      </div>
      {items.length === 0 ? (
        <EmptyState search={search} openCreate={openCreate} />
      ) : (
        <div className={view === 'grid' ? 'bookmark-grid' : 'bookmark-list'}>
          {items.map((item) => (
            <BookmarkCard
              key={item.id}
              item={item}
              categories={categories}
              list={view === 'list'}
              onFavorite={() => toggleFavorite(item.id)}
              onEdit={() => openEdit(item)}
              onDelete={() => removeBookmark(item)}
            />
          ))}
        </div>
      )}
      <div className="pagination">
        <span>
          Showing{' '}
          <strong>
            {items.length ? 1 : 0}–{items.length}
          </strong>{' '}
          of <strong>{items.length}</strong> bookmarks
        </span>
        <div>
          <button disabled aria-label="Previous page">
            <ChevronLeft size={16} />
          </button>
          <button className="page-current">1</button>
          <button disabled aria-label="Next page">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </>
  )
}

function BookmarkCard({ item, list, onFavorite, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <article className={`bookmark-card ${list ? 'bookmark-card-list' : ''}`}>
      <div className={`bookmark-cover ${item.color || 'lavender'}`}>
        <div className="cover-pattern" />
        <span className="cover-domain-icon">
          {item.type === 'Video' ? (
            <Video size={22} />
          ) : item.type === 'Documentation' ? (
            <FileText size={22} />
          ) : item.type === 'Course' ? (
            <Compass size={22} />
          ) : (
            <Globe2 size={22} />
          )}
        </span>
        <span className="content-type">{item.type}</span>
        <button
          className={`favorite-button ${item.favorite ? 'is-favorite' : ''}`}
          onClick={onFavorite}
          aria-label={item.favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart size={16} fill={item.favorite ? 'currentColor' : 'none'} />
        </button>
        <div className="cover-decoration">
          {item.category === 'Development'
            ? '⌘'
            : item.category === 'Design'
              ? '✳'
              : item.category === 'Productivity'
                ? '✦'
                : '◌'}
        </div>
      </div>
      <div className="bookmark-body">
        <div className="bookmark-meta">
          <span className="bookmark-domain">
            <i>◉</i>
            {domainOf(item.url)}
          </span>
          <span className="bookmark-date">{formatDate(item.date)}</span>
        </div>
        <button className="bookmark-title" onClick={onEdit}>
          {item.title}
        </button>
        <p className="bookmark-description">{item.description || 'No description added yet.'}</p>
        <div className="bookmark-tags">
          <span className="category-pill" style={{ '--pill-color': categoryColor(item.category) }}>
            {item.category}
          </span>
          {item.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="tag-pill">
              #{tag}
            </span>
          ))}
          {item.tags.length > 2 && <span className="tag-pill">+{item.tags.length - 2}</span>}
        </div>
        <div className="bookmark-footer">
          <span className="bookmark-added">
            <Clock3 size={13} /> Saved {formatDate(item.date)}
          </span>
          <div className="bookmark-actions">
            <button className="card-action" onClick={onEdit}>
              Edit
            </button>
            <div className="more-wrap">
              <button
                className="more-button"
                aria-label="More bookmark actions"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <MoreHorizontal size={17} />
              </button>
              {menuOpen && (
                <div className="card-menu">
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      onEdit()
                    }}
                  >
                    <Link2 size={14} /> Edit details
                  </button>
                  <button
                    className="danger-menu"
                    onClick={() => {
                      setMenuOpen(false)
                      onDelete()
                    }}
                  >
                    <Trash2 size={14} /> Delete bookmark
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

function categoryColor(name) {
  return (
    {
      Development: '#8985c9',
      Design: '#dc9278',
      Productivity: '#6caa8e',
      Research: '#6398bf',
      Learning: '#aa88c9',
    }[name] || '#8993aa'
  )
}

function EmptyState({ search, openCreate }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Search size={25} />
      </span>
      <h2>{search ? 'Nothing found just yet' : 'Your next good find goes here'}</h2>
      <p>
        {search
          ? 'Try another search, or check your spelling.'
          : 'Save a useful link and start building your personal library.'}
      </p>
      {!search && (
        <button className="button button-primary" onClick={openCreate}>
          <Plus size={16} /> Add your first bookmark
        </button>
      )}
    </div>
  )
}

function CollectionsPage({ collections, bookmarks, onCreate, openCollection }) {
  return (
    <>
      <PageHeading
        eyebrow="A HOME FOR GOOD IDEAS"
        title="Collections"
        subtitle="Bring related bookmarks together, your way."
        action={onCreate}
        actionLabel="New collection"
      />
      <div className="collection-grid">
        {collections.map((collection) => (
          <button
            key={collection.id}
            className="collection-card"
            onClick={() => openCollection(collection.id)}
          >
            <div className={`collection-card-art ${collection.color}`}>
              <div className="collection-art-orbit" />
              <span>{collection.emoji}</span>
              <i className="collection-art-dot" />
              <i className="collection-art-dot second" />
            </div>
            <div className="collection-card-body">
              <div className="collection-card-title">
                <h2>{collection.name}</h2>
                <span>
                  <ArrowUpRight size={16} />
                </span>
              </div>
              <p>{collection.description}</p>
              <div className="collection-card-footer">
                <div className="collection-avatars">
                  {collection.bookmarkIds.slice(0, 3).map((id, i) => {
                    const bookmark = bookmarks.find((item) => item.id === id)
                    return (
                      <span
                        key={id}
                        className={`collection-avatar ${bookmark?.color || ['lavender', 'peach', 'mint'][i]}`}
                      >
                        {bookmark?.type === 'Video' ? '▶' : '↗'}
                      </span>
                    )
                  })}
                </div>
                <span>
                  {collection.bookmarkIds.length}{' '}
                  {collection.bookmarkIds.length === 1 ? 'bookmark' : 'bookmarks'}
                </span>
              </div>
            </div>
          </button>
        ))}
        <button className="new-collection-card" onClick={onCreate}>
          <span>
            <Plus size={19} />
          </span>
          <strong>Create a collection</strong>
          <small>Make room for something new.</small>
        </button>
      </div>
    </>
  )
}

function CategoriesPage({ categories, bookmarks, onCreate, openCategory }) {
  return (
    <>
      <PageHeading
        eyebrow="A LITTLE ORDER"
        title="Categories"
        subtitle="Your bookmarks, sorted into the things you care about."
        action={onCreate}
        actionLabel="New category"
      />
      <div className="category-grid">
        {categories.map((category) => {
          const count = bookmarks.filter((item) => item.category === category.name).length
          return (
            <button
              key={category.name}
              className="category-card"
              onClick={() => openCategory(category.name)}
            >
              <div className="category-card-top">
                <span className="category-big-icon" style={{ '--category-color': category.color }}>
                  {category.icon || '◈'}
                </span>
                <ArrowUpRight size={16} />
              </div>
              <h2>{category.name}</h2>
              <p>
                {count} {count === 1 ? 'bookmark' : 'bookmarks'} tucked in here
              </p>
              <div className="category-card-line" style={{ '--category-color': category.color }} />
            </button>
          )
        })}
        <button className="new-category-card" onClick={onCreate}>
          <span>
            <Plus size={18} />
          </span>
          <strong>Create category</strong>
        </button>
      </div>
    </>
  )
}

function SettingsPage({ user, onSave, onLogout, theme, onToggleTheme }) {
  const [name, setName] = useState(user.name || '')
  const [activeTab, setActiveTab] = useState('profile')
  const workspaceName = user.name?.trim() || user.email?.split('@')[0] || 'Personal'

  const chooseTheme = (nextTheme) => {
    if (theme !== nextTheme) onToggleTheme()
  }

  return (
    <>
      <PageHeading
        eyebrow="YOUR SPACE, YOUR WAY"
        title="Settings"
        subtitle="A few details to make Collectly feel like yours."
      />
      <div className="settings-layout">
        <aside className="settings-menu">
          <button
            className={`settings-tab ${activeTab === 'profile' ? 'selected' : ''}`}
            type="button"
            onClick={() => setActiveTab('profile')}
          >
            <UserRound size={16} />
            Profile
          </button>
          <button
            className={`settings-tab ${activeTab === 'preferences' ? 'selected' : ''}`}
            type="button"
            onClick={() => setActiveTab('preferences')}
          >
            <Settings size={16} />
            Preferences
          </button>
          <button
            className={`settings-tab ${activeTab === 'workspace' ? 'selected' : ''}`}
            type="button"
            onClick={() => setActiveTab('workspace')}
          >
            <Layers3 size={16} />
            Workspace
          </button>
        </aside>
        <section className="settings-card">
          {activeTab === 'profile' && (
            <>
              <div className="settings-section-heading">
                <span className="settings-avatar">{name.slice(0, 1).toUpperCase() || 'A'}</span>
                <div>
                  <h2>Personal information</h2>
                  <p>Update your name and the details on your account.</p>
                </div>
              </div>
              <label className="field-label">
                Display name
                <input
                  className="text-input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                />
              </label>
              <label className="field-label">
                Email address
                <input className="text-input disabled-input" value={user.email} readOnly />
                <small>Your email address can’t be changed here.</small>
              </label>
              <div className="settings-divider" />
              <div className="settings-section-heading compact">
                <div>
                  <h2>Account</h2>
                  <p>Manage your session and personal library.</p>
                </div>
              </div>
              <button className="button button-outline settings-logout" onClick={onLogout}>
                <LogOut size={15} />
                Log out
              </button>
              <div className="settings-save-row">
                <span>Your changes are saved to your account.</span>
                <button
                  className="button button-primary"
                  onClick={() => onSave(name.trim() || 'Alex Morgan')}
                >
                  <Check size={15} />
                  Save changes
                </button>
              </div>
            </>
          )}
          {activeTab === 'preferences' && (
            <>
              <div className="settings-section-heading">
                <span className="settings-avatar"><Settings size={19} /></span>
                <div>
                  <h2>Preferences</h2>
                  <p>Choose how Collectly looks on this device.</p>
                </div>
              </div>
              <div className="settings-preference-row">
                <div>
                  <strong>Appearance</strong>
                  <small>Select a light or dark theme.</small>
                </div>
                <div className="settings-theme-options">
                  <button
                    className={`settings-theme-option ${theme === 'light' ? 'selected' : ''}`}
                    type="button"
                    aria-pressed={theme === 'light'}
                    onClick={() => chooseTheme('light')}
                  >
                    <Sun size={15} /> Light
                  </button>
                  <button
                    className={`settings-theme-option ${theme === 'dark' ? 'selected' : ''}`}
                    type="button"
                    aria-pressed={theme === 'dark'}
                    onClick={() => chooseTheme('dark')}
                  >
                    <Moon size={15} /> Dark
                  </button>
                </div>
              </div>
            </>
          )}
          {activeTab === 'workspace' && (
            <>
              <div className="settings-section-heading">
                <span className="settings-avatar"><Layers3 size={19} /></span>
                <div>
                  <h2>{workspaceName}’s space</h2>
                  <p>Your personal workspace</p>
                </div>
              </div>
              <div className="workspace-details">
                <div>
                  <small>Workspace type</small>
                  <strong>Personal</strong>
                </div>
                <div>
                  <small>Workspace owner</small>
                  <strong>{workspaceName}</strong>
                </div>
                <div>
                  <small>Account email</small>
                  <strong>{user.email}</strong>
                </div>
              </div>
              <p className="workspace-description">
                Your bookmarks, categories, and collections are private to this account.
              </p>
              <button
                className="button button-outline workspace-profile-link"
                type="button"
                onClick={() => setActiveTab('profile')}
              >
                <UserRound size={15} />
                Manage profile
              </button>
            </>
          )}
        </section>
      </div>
    </>
  )
}

function AuthScreen({ theme, toggleTheme, transitionTarget, onLogin }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    if (mode === 'register' && password.length < 8) {
      setError('Use a password with at least 8 characters.')
      return
    }
    if (mode === 'register' && password !== passwordConfirmation) {
      setError('The passwords do not match.')
      return
    }
    setError('')
    setIsSubmitting(true)
    try {
      await onLogin({ mode, name: name.trim(), email: email.trim(), password, passwordConfirmation })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <div className={`auth-screen ${theme === 'dark' ? 'theme-dark' : ''}`}>
      <div className="auth-left">
        <div className="auth-left-top">
          <Brand />
          <span className="auth-top-note">A HOME FOR YOUR CURIOSITY</span>
        </div>
        <div className="auth-art-copy">
          <span className="auth-kicker">
            <span /> LESS SCATTERED. MORE YOU.
          </span>
          <h1>
            Good things
            <br />
            deserve to be
            <br />
            <em>kept close.</em>
          </h1>
          <p>
            One thoughtful home for all the articles, ideas and little discoveries you want to find
            again.
          </p>
          <div className="auth-preview">
            <div className="preview-stack">
              <span>✦</span>
              <span>◈</span>
              <span>✳</span>
            </div>
            <div>
              <strong>A library that feels like yours</strong>
              <small>Save it now. Find it when it matters.</small>
            </div>
            <ArrowRight size={16} />
          </div>
        </div>
        <div className="auth-left-footer">
          <span>Made for curious minds.</span>
          <span>
            Thoughtfully, Collectly <span className="brand-period">✳</span>
          </span>
        </div>
      </div>
      <div className="auth-right">
        <button
          className="theme-toggle auth-theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand">
            <Brand />
          </div>
          <div className="auth-mobile-sculpture">
            <InteractiveSculpture />
          </div>
          <div className="auth-welcome">
            <span className="auth-icon">
              <Bookmark size={18} />
            </span>
            <span className="eyebrow">YOUR PERSONAL LIBRARY</span>
            <h2>{mode === 'login' ? 'Welcome back' : 'Make yourself at home'}</h2>
            <p>
              {mode === 'login'
                ? 'Pick up where your curiosity left off.'
                : 'Start gathering the good things you find.'}
            </p>
          </div>
          <form onSubmit={submit} className="auth-form">
            {mode === 'register' && (
              <label className="field-label">
                Your name
                <input
                  className="text-input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Alex Morgan"
                  required
                />
              </label>
            )}
            <label className="field-label">
              Email address
              <input
                className="text-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
            <label className="field-label">
              Password
              <span className="password-wrap">
                <input
                  className="text-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}
                  minLength={mode === 'register' ? 8 : undefined}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </span>
            </label>
            {mode === 'register' && (
              <label className="field-label">
                Confirm password
                <input
                  className="text-input"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordConfirmation}
                  onChange={(event) => setPasswordConfirmation(event.target.value)}
                  minLength={8}
                  required
                />
              </label>
            )}
            {mode === 'login' && (
              <button
                type="button"
                className="forgot-link"
                onClick={() => setError('Password reset is not available yet.')}
              >
                Forgot password?
              </button>
            )}
            {error && <p className="form-error">{error}</p>}
            <button
              className="button button-primary auth-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Please wait…'
                : mode === 'login'
                  ? 'Sign in to your library'
                  : 'Create your account'}
              <ArrowRight size={16} />
            </button>
            <div className="auth-or">
              <span />
              or
              <span />
            </div>
            <button
              className="button button-google"
              type="button"
              onClick={() => {
                setError('Google sign-in is not connected yet.')
              }}
            >
              <svg className="google-logo" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M47.98 24.55c0-1.57-.14-3.08-.4-4.55H24v9.02h13.48c-.58 2.96-2.32 5.47-4.94 7.16v5.99h7.99c4.68-4.31 7.45-10.65 7.45-17.62z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.72 0 12.34-2.23 16.45-6.03l-7.99-5.99c-2.22 1.49-5.06 2.38-8.46 2.38-6.49 0-12-4.38-13.97-10.28H1.78v6.18C5.87 41.32 14.29 48 24 48z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.03 28.08A14.4 14.4 0 0 1 9.28 24c0-1.41.25-2.78.7-4.08v-6.18H1.78A24 24 0 0 0 0 24c0 3.87.93 7.54 2.57 10.78z"
                />
                <path
                  fill="#EA4335"
                  d="M24 9.55c3.66 0 6.94 1.26 9.52 3.75l7.15-7.15C36.33 2.37 30.71 0 24 0 14.29 0 5.87 6.68 1.78 13.74l8.2 6.18C12 13.93 17.51 9.55 24 9.55z"
                />
              </svg>
              Continue with Google
            </button>
          </form>
          <p className="auth-toggle">
            {mode === 'login' ? 'New around here?' : 'Already have an account?'}{' '}
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setError('')
              }}
            >
              {mode === 'login' ? 'Create an account' : 'Sign in'}
            </button>
          </p>
          <div className="auth-legal">
            By continuing, you agree to our <button>Terms</button> and{' '}
            <button>Privacy Policy</button>.
          </div>
        </div>
      </div>
      {transitionTarget && <ThemeTransition targetTheme={transitionTarget} />}
    </div>
  )
}

function BookmarkModal({ bookmark, categories, collections, onClose, onSave }) {
  const [form, setForm] = useState(
    bookmark || {
      url: '',
      title: '',
      description: '',
      category: categories[0]?.name || 'Uncategorized',
      tags: [],
      type: 'Article',
      note: '',
      favorite: false,
    },
  )
  const [tagInput, setTagInput] = useState('')
  const [selectedCollections, setSelectedCollections] = useState(() =>
    collections
      .filter((collection) => collection.bookmarkIds.includes(bookmark?.id))
      .map((collection) => collection.id),
  )
  const [error, setError] = useState('')
  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const handleUrl = (value) => {
    change('url', value)
    if (!form.title && value.includes('.')) {
      try {
        const host = new URL(value.startsWith('http') ? value : `https://${value}`).hostname
          .replace('www.', '')
          .split('.')[0]
        change('title', host.slice(0, 1).toUpperCase() + host.slice(1))
      } catch {}
    }
  }
  const addTag = (event) => {
    if (event.key === 'Enter' && tagInput.trim()) {
      event.preventDefault()
      change('tags', [...new Set([...(form.tags || []), tagInput.trim().replace(/^#/, '')])])
      setTagInput('')
    }
  }
  const submit = (event) => {
    event.preventDefault()
    try {
      const parsed = new URL(form.url.startsWith('http') ? form.url : `https://${form.url}`)
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error()
      const next = {
        ...form,
        url: parsed.href,
        title: form.title.trim(),
        tags: form.tags || [],
        collectionIds: selectedCollections,
      }
      if (!next.title) {
        setError('Add a title for this bookmark.')
        return
      }
      onSave(next)
    } catch {
      setError('Enter a valid website address, like example.com.')
    }
  }
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section className="modal bookmark-modal">
        <div className="modal-heading">
          <div>
            <span className="modal-icon">
              <Bookmark size={17} />
            </span>
            <div>
              <h2>{bookmark ? 'Edit bookmark' : 'Save a new bookmark'}</h2>
              <p>Keep something good close at hand.</p>
            </div>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit}>
          <label className="field-label">
            Website URL
            <div className="input-with-icon">
              <Link2 size={16} />
              <input
                className="text-input"
                value={form.url}
                onChange={(event) => handleUrl(event.target.value)}
                placeholder="https://something-wonderful.com"
                autoFocus
              />
            </div>
          </label>
          <label className="field-label">
            Title
            <input
              className="text-input"
              value={form.title}
              onChange={(event) => change('title', event.target.value)}
              placeholder="A name you’ll remember"
            />
          </label>
          <label className="field-label">
            Description
            <textarea
              className="text-input textarea"
              value={form.description}
              onChange={(event) => change('description', event.target.value)}
              placeholder="What makes this worth keeping?"
              rows={3}
            />
          </label>
          <div className="form-two-col">
            <label className="field-label">
              Category
              <StyledDropdown
                value={form.category}
                options={[...categories.map((category) => category.name), 'Uncategorized']}
                onChange={(value) => change('category', value)}
                ariaLabel="Bookmark category"
                className="modal-dropdown"
              />
            </label>
            <label className="field-label">
              Content type
              <StyledDropdown
                value={form.type}
                options={[
                  'Article',
                  'Website',
                  'Course',
                  'Documentation',
                  'Video',
                  'Research paper',
                  'Tool',
                ]}
                onChange={(value) => change('type', value)}
                ariaLabel="Bookmark content type"
                className="modal-dropdown"
              />
            </label>
          </div>
          <label className="field-label">
            Tags
            <span className="tag-input-wrap">
              <span className="tag-chip-list">
                {(form.tags || []).map((tag) => (
                  <span key={tag} className="tag-chip">
                    #{tag}
                    <button
                      type="button"
                      onClick={() =>
                        change(
                          'tags',
                          form.tags.filter((value) => value !== tag),
                        )
                      }
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </span>
              <input
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={addTag}
                placeholder="Type a tag and press Enter"
              />
            </span>
            <small className="field-hint">Press Enter to add each tag.</small>
          </label>
          <label className="field-label">
            Personal note
            <textarea
              className="text-input textarea"
              value={form.note || ''}
              onChange={(event) => change('note', event.target.value)}
              placeholder="Add a thought for your future self..."
              rows={2}
            />
          </label>
          <div className="modal-inline-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.favorite}
                onChange={(event) => change('favorite', event.target.checked)}
              />
              <Heart size={15} />
              Add to favorites
            </label>
            <div className="collection-select">
              <span>
                <Layers3 size={15} />
                Add to collection
              </span>
              {collections.length > 0 ? (
                <div>
                  {collections.map((collection) => (
                    <label key={collection.id}>
                      <input
                        type="checkbox"
                        checked={selectedCollections.includes(collection.id)}
                        onChange={(event) =>
                          setSelectedCollections((current) =>
                            event.target.checked
                              ? [...current, collection.id]
                              : current.filter((id) => id !== collection.id),
                          )
                        }
                      />
                      {collection.name}
                    </label>
                  ))}
                </div>
              ) : (
                <p className="collection-empty-state">
                  No collections yet. Create one from the Collections page to organize this bookmark.
                </p>
              )}
            </div>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-footer">
            <button type="button" className="button button-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button button-primary">
              <Bookmark size={15} />
              {bookmark ? 'Save changes' : 'Save bookmark'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function CollectionModal({ onClose, onSave }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [emoji, setEmoji] = useState('')
  const [error, setError] = useState('')
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section className="modal small-modal">
        <div className="modal-heading">
          <div>
            <span className="modal-icon">
              <Folder size={17} />
            </span>
            <div>
              <h2>New collection</h2>
              <p>Make room for something new.</p>
            </div>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (!name.trim()) {
              setError('Give your collection a name.')
              return
            }
            onSave({
              name: name.trim(),
              description: description.trim(),
              emoji: emoji.trim() || '✦',
              color: ['collection-lilac', 'collection-green', 'collection-peach'][
                Math.floor(Math.random() * 3)
              ],
            })
          }}
        >
          <label className="field-label">
            Collection name
            <input
              className="text-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Weekend reading"
              autoFocus
            />
          </label>
          <label className="field-label">
            Description
            <textarea
              className="text-input textarea"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What belongs in this collection?"
              rows={3}
            />
          </label>
          <label className="field-label">
            Choose an emoji
            <input
              className="text-input emoji-input"
              value={emoji}
              onChange={(event) => setEmoji(event.target.value)}
              placeholder="✦"
              maxLength={4}
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-footer">
            <button type="button" className="button button-outline" onClick={onClose}>
              Cancel
            </button>
            <button className="button button-primary">
              <Plus size={15} />
              Create collection
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function CategoryModal({ onClose, onSave }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#8b83c8')
  const [error, setError] = useState('')
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section className="modal small-modal">
        <div className="modal-heading">
          <div>
            <span className="modal-icon">
              <Tag size={17} />
            </span>
            <div>
              <h2>New category</h2>
              <p>Give a corner of your library its own name.</p>
            </div>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (!name.trim()) {
              setError('Give your category a name.')
              return
            }
            onSave({ name: name.trim(), color, icon: '✳' })
          }}
        >
          <label className="field-label">
            Category name
            <input
              className="text-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Cooking"
              autoFocus
            />
          </label>
          <label className="field-label">
            Choose a color
            <span className="color-options">
              {['#8b83c8', '#dc9278', '#6caa8e', '#6398bf', '#d3a956', '#ca7fa0'].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={color === value ? 'chosen' : ''}
                  style={{ '--swatch': value }}
                  onClick={() => setColor(value)}
                  aria-label={`Select ${value}`}
                />
              ))}
            </span>
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-footer">
            <button type="button" className="button button-outline" onClick={onClose}>
              Cancel
            </button>
            <button className="button button-primary">
              <Plus size={15} />
              Create category
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function ConfirmModal({ bookmark, onClose, onConfirm }) {
  return (
    <div className="modal-backdrop">
      <section className="modal confirm-modal">
        <span className="confirm-icon">
          <Trash2 size={19} />
        </span>
        <h2>Delete this bookmark?</h2>
        <p>
          <strong>{bookmark.title}</strong> will be removed from your library and any collections.
          This can’t be undone.
        </p>
        <div className="modal-footer">
          <button className="button button-outline" onClick={onClose}>
            Keep bookmark
          </button>
          <button className="button button-danger" onClick={onConfirm}>
            <Trash2 size={15} />
            Delete bookmark
          </button>
        </div>
      </section>
    </div>
  )
}

function ConfirmCollectionModal({ collection, onClose, onConfirm }) {
  return (
    <div className="modal-backdrop">
      <section className="modal confirm-modal">
        <span className="confirm-icon">
          <Trash2 size={19} />
        </span>
        <h2>Delete this collection?</h2>
        <p>
          <strong>{collection.name}</strong> will be deleted. Its bookmarks will remain in your
          library, but they will be removed from this collection. This can’t be undone.
        </p>
        <div className="modal-footer">
          <button className="button button-outline" onClick={onClose}>
            Keep collection
          </button>
          <button className="button button-danger" onClick={onConfirm}>
            <Trash2 size={15} />
            Delete collection
          </button>
        </div>
      </section>
    </div>
  )
}

function ConfirmCategoryModal({ category, onClose, onConfirm }) {
  return (
    <div className="modal-backdrop">
      <section className="modal confirm-modal">
        <span className="confirm-icon">
          <Trash2 size={19} />
        </span>
        <h2>Delete this category?</h2>
        <p>
          <strong>{category.name}</strong> will be deleted. Its bookmarks will remain in your
          library and become uncategorized. This can’t be undone.
        </p>
        <div className="modal-footer">
          <button className="button button-outline" onClick={onClose}>
            Keep category
          </button>
          <button className="button button-danger" onClick={onConfirm}>
            <Trash2 size={15} />
            Delete category
          </button>
        </div>
      </section>
    </div>
  )
}

export default App
