import React, { useState, useEffect } from 'react';
import db from '../../services/db';
import {
  HiOutlineNewspaper,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencilAlt,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import { DEFAULT_BLOG_COVER, avatarFor } from '../../utils/avatar';

const CATEGORIES = ['Cardiology', 'General Health', 'Mental Health', 'Pediatrics', 'Dermatology'];

const BlogManagerPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Cardiology');
  const [content, setContent] = useState('');
  const [readTime, setReadTime] = useState('4 min read');
  const [author, setAuthor] = useState('Dr. Fahim Ahmed');
  const [image, setImage] = useState(DEFAULT_BLOG_COVER);
  const [successNotice, setSuccessNotice] = useState('');

  useEffect(() => {
    return db.subscribe('blogs', (list) => {
      setBlogs(list || []);
    });
  }, []);

  const handleOpenNew = () => {
    setEditingId(null);
    setTitle('');
    setCategory('Cardiology');
    setContent('');
    setReadTime('4 min read');
    setAuthor('HealthConnect Editorial Board');
    setImage(DEFAULT_BLOG_COVER);
    setShowEditor(true);
  };

  const handleEdit = (blog) => {
    setEditingId(blog.id);
    setTitle(blog.title);
    setCategory(blog.category);
    setContent(blog.content);
    setReadTime(blog.readTime);
    setAuthor(blog.author);
    setImage(blog.image);
    setShowEditor(true);
  };

  const handleDelete = (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this article?');
    if (confirmed) {
      db.remove('blogs', id);
      setSuccessNotice('Article successfully deleted.');
      setTimeout(() => setSuccessNotice(''), 2500);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    if (editingId) {
      db.update('blogs', editingId, {
        title: title.trim(),
        category,
        content: content.trim(),
        readTime,
        author: author.trim(),
        image: image.trim(),
      });
      setSuccessNotice('Article successfully updated.');
    } else {
      db.add('blogs', {
        title: title.trim(),
        category,
        content: content.trim(),
        readTime,
        author: author.trim(),
        authorAvatar: avatarFor(author.trim()),
        image: image.trim(),
        likes: 0,
      });
      setSuccessNotice('Article published to community feed.');
    }

    setShowEditor(false);
    setTimeout(() => setSuccessNotice(''), 2500);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Community Health Editorial CMS</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Publish verified medical education, prevention guidelines, and wellness articles.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <HiOutlinePlus className="w-4 h-4" />
          <span>Write New Article</span>
        </button>
      </div>

      {successNotice && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs sm:text-sm font-bold flex items-center gap-2">
          <HiOutlineCheckCircle className="w-5 h-5 text-teal-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-gray-900 text-lg">
              {editingId ? 'Edit Health Article' : 'Write New Article'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Article Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g., Managing Hypertension in Everyday Life"
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Estimated Read Time
                  </label>
                  <input
                    type="text"
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    placeholder="E.g., 4 min read"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Author Attribution
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Cover Image URL / Path
                </label>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  required
                  placeholder="Image URL or local path"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
                />
                {image && (
                  <div className="mt-2 relative rounded-xl overflow-hidden border border-gray-200 h-36 bg-gray-50">
                    <img
                      src={image}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-medium backdrop-blur-xs">
                      Cover Preview
                    </span>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                    Article Body Text (Markdown Supported) *
                  </label>
                  <span className="text-[10px] text-gray-400">{content.length} characters</span>
                </div>
                <textarea
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Compose article contents..."
                  required
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-primary"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditor(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {editingId ? 'Save Changes' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {blogs.map((blog) => (
          <div
            key={blog.id}
            className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs flex flex-col justify-between"
          >
            <div>
              <img src={blog.image} alt={blog.title} className="w-full h-44 object-cover" />
              <div className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">
                    {blog.category}
                  </span>
                  <span className="text-[11px] text-gray-400">{blog.readTime}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2">
                  {blog.title}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                  {blog.content}
                </p>
                <p className="text-[11px] text-gray-400 pt-1">By {blog.author}</p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => handleEdit(blog)}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white rounded-xl transition-colors cursor-pointer"
                title="Edit article"
              >
                <HiOutlinePencilAlt className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(blog.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-xl transition-colors cursor-pointer"
                title="Delete article"
              >
                <HiOutlineTrash className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlogManagerPage;
