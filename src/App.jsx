import { useEffect, useRef, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'basic-gallery-files-v1'

function App() {
  const [files, setFiles] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
    } catch {
      return []
    }
  })
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files))
  }, [files])

  const addFiles = (selectedFiles) => {
    const incoming = Array.from(selectedFiles)
    if (!incoming.length) return

    const readers = incoming.map((file) => new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        uploadedAt: new Date().toLocaleString(),
        data: reader.result,
      })
      reader.readAsDataURL(file)
    }))

    Promise.all(readers)
      .then((newFiles) => setFiles((prev) => [...newFiles, ...prev]))
      .catch(() => alert('Could not save these files. Try uploading smaller files.'))
  }

  const removeFile = (id) => setFiles((prev) => prev.filter((file) => file.id !== id))

  const clearAll = () => {
    if (window.confirm('Remove all files from your gallery?')) setFiles([])
  }

  const openFile = (file) => {
    window.open(file.data, '_blank', 'noopener,noreferrer')
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <main className="app">
      <header className="header">
        <div>
          <h1>My Gallery</h1>
          <p className="subtitle">Upload and manage your photos and files.</p>
        </div>
        <div className="header-actions">
          <span className="count">{files.length} {files.length === 1 ? 'item' : 'items'}</span>
          {files.length > 0 && <button className="clear-btn" onClick={clearAll}>Clear all</button>}
        </div>
      </header>

      <section
        className={`upload-zone ${dragActive ? 'dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragActive(false)
          addFiles(e.dataTransfer.files)
        }}
      >
        <h2>Add files</h2>
        <p>Choose files from your computer or drag them here.</p>
        <button className="upload-btn" onClick={() => inputRef.current?.click()}>Choose files</button>
        <input ref={inputRef} type="file" multiple onChange={(e) => addFiles(e.target.files)} />
      </section>

      <section className="gallery-section">
        <div className="section-title">
          <h2>Gallery</h2>
          <span>Double-click a file to open it</span>
        </div>

        {files.length === 0 ? (
          <div className="empty-state">
            <h3>Your gallery is empty</h3>
            <p>Upload a few files to see them here.</p>
          </div>
        ) : (
          <div className="gallery-grid">
            {files.map((file) => {
              const isImage = file.type.startsWith('image/')
              const extension = file.name.includes('.')
                ? file.name.split('.').pop().toUpperCase().slice(0, 5)
                : 'FILE'

              return (
                <article
                  className="file-card"
                  key={file.id}
                  onDoubleClick={() => openFile(file)}
                  title="Double-click to open"
                >
                  <div className="preview">
                    {isImage ? (
                      <img src={file.data} alt={file.name} />
                    ) : (
                      <div className="file-icon">{extension}</div>
                    )}
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFile(file.id)
                      }}
                      aria-label={`Delete ${file.name}`}
                    >
                      ×
                    </button>
                  </div>
                  <div className="file-info">
                    <h3 title={file.name}>{file.name}</h3>
                    <p>{formatSize(file.size)} · {file.uploadedAt}</p>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}

export default App
