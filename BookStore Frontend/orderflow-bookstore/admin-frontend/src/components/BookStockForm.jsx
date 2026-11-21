import { ImagePlus, Loader2, PlusCircle, Save, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * Resize uploaded book cover images so they stay lightweight for testing preview.
 */
function resizeImageFileToDataUrl(file, maxWidth = 420) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('The selected file is not a valid image.'));
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const targetWidth = Math.max(1, Math.round(img.width * scale));
        const targetHeight = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result || ''));
          return;
        }
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

export default function BookStockForm({
  editingBook = null,
  onSubmit,
  onCancelEdit,
  submitting = false,
}) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageError, setImageError] = useState(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (editingBook) {
      setTitle(String(editingBook.title ?? ''));
      setAuthor(String(editingBook.author ?? ''));
      setPrice(editingBook.price !== undefined && editingBook.price !== null ? String(editingBook.price) : '');
      setStockQuantity(
        editingBook.stockQuantity !== undefined && editingBook.stockQuantity !== null
          ? String(editingBook.stockQuantity)
          : '0'
      );
      setImageUrl(String(editingBook.imageUrl ?? ''));
      setImageError(null);
      setPreviewFailed(false);
      setErrors({});
    } else {
      setTitle('');
      setAuthor('');
      setPrice('');
      setStockQuantity('');
      setImageUrl('');
      setImageError(null);
      setPreviewFailed(false);
      setErrors({});
    }
  }, [editingBook]);

  const validate = () => {
    const nextErrors = {};
    if (!title.trim()) {
      nextErrors.title = 'Book title is required.';
    }
    if (!author.trim()) {
      nextErrors.author = 'Author name is required.';
    }
    const parsedPrice = Number(price);
    if (price === '' || Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      nextErrors.price = 'Price must be greater than 0.';
    }
    const parsedStock = Number(stockQuantity);
    if (
      stockQuantity === ''
      || Number.isNaN(parsedStock)
      || !Number.isInteger(parsedStock)
      || parsedStock < 0
    ) {
      nextErrors.stockQuantity = 'Stock quantity must be a whole number (0 or greater).';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleImageFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file (PNG, JPG, or WebP).');
      return;
    }

    setImageError(null);
    setPreviewFailed(false);
    try {
      const dataUrl = await resizeImageFileToDataUrl(file);
      setImageUrl(dataUrl);
    } catch (err) {
      setImageError(err.message || 'Unable to load the selected cover image.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearImage = () => {
    setImageUrl('');
    setImageError(null);
    setPreviewFailed(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate() || submitting) {
      return;
    }

    const success = await onSubmit({
      title: title.trim(),
      author: author.trim(),
      price: Number(price),
      stockQuantity: Number(stockQuantity),
      imageUrl: imageUrl.trim(),
    });

    if (success && !editingBook) {
      setTitle('');
      setAuthor('');
      setPrice('');
      setStockQuantity('');
      setImageUrl('');
      setImageError(null);
      setPreviewFailed(false);
      setErrors({});
    }
  };

  const isEditing = Boolean(editingBook);
  const urlInputDisplayValue = imageUrl.startsWith('data:') ? '' : imageUrl;

  return (
    <section className="af-card" aria-label={isEditing ? 'Update book details and stock' : 'Add new book to stock'}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div>
          <h2 className="af-section-title">
            {isEditing ? `Update Book #${editingBook.bookId}` : 'Add New Book to Stock'}
          </h2>
          <p className="af-section-desc" style={{ marginBottom: 0 }}>
            {isEditing
              ? 'Update the book title, author, unit price, cover image, or available stock quantity.'
              : 'Enter book details below to add a new title to store inventory and feature it in the customer catalogue.'}
          </p>
        </div>

        {isEditing ? (
          <button
            type="button"
            className="af-btn af-btn-secondary"
            onClick={onCancelEdit}
            disabled={submitting}
          >
            <X size={15} aria-hidden="true" />
            <span>Cancel Edit</span>
          </button>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="af-form-grid">
          <div className="af-form-field">
            <label htmlFor="book-form-title" className="af-label">
              Book Title
            </label>
            <input
              id="book-form-title"
              type="text"
              className={`af-input af-input-rect ${errors.title ? 'af-input-error' : ''}`}
              placeholder="e.g. Clean Architecture"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((p) => ({ ...p, title: undefined }));
              }}
              disabled={submitting}
            />
            {errors.title ? <p className="af-field-error">{errors.title}</p> : null}
          </div>

          <div className="af-form-field">
            <label htmlFor="book-form-author" className="af-label">
              Author
            </label>
            <input
              id="book-form-author"
              type="text"
              className={`af-input af-input-rect ${errors.author ? 'af-input-error' : ''}`}
              placeholder="e.g. Robert C. Martin"
              value={author}
              onChange={(e) => {
                setAuthor(e.target.value);
                if (errors.author) setErrors((p) => ({ ...p, author: undefined }));
              }}
              disabled={submitting}
            />
            {errors.author ? <p className="af-field-error">{errors.author}</p> : null}
          </div>

          <div className="af-form-field">
            <label htmlFor="book-form-price" className="af-label">
              Unit Price ($)
            </label>
            <input
              id="book-form-price"
              type="number"
              step="0.01"
              min="0.01"
              className={`af-input af-input-rect ${errors.price ? 'af-input-error' : ''}`}
              placeholder="e.g. 42.50"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                if (errors.price) setErrors((p) => ({ ...p, price: undefined }));
              }}
              disabled={submitting}
            />
            {errors.price ? <p className="af-field-error">{errors.price}</p> : null}
          </div>

          <div className="af-form-field">
            <label htmlFor="book-form-stock" className="af-label">
              Stock Quantity
            </label>
            <input
              id="book-form-stock"
              type="number"
              step="1"
              min="0"
              className={`af-input af-input-rect ${errors.stockQuantity ? 'af-input-error' : ''}`}
              placeholder="e.g. 25"
              value={stockQuantity}
              onChange={(e) => {
                setStockQuantity(e.target.value);
                if (errors.stockQuantity) setErrors((p) => ({ ...p, stockQuantity: undefined }));
              }}
              disabled={submitting}
            />
            {errors.stockQuantity ? <p className="af-field-error">{errors.stockQuantity}</p> : null}
          </div>
        </div>

        {/* Optional Book Cover Image (Temporary Testing Option) */}
        <div className="af-cover-upload-box">
          <div className="af-cover-preview" aria-label="Book cover image preview">
            {imageUrl && !previewFailed ? (
              <img
                src={imageUrl}
                alt={title ? `Cover preview for ${title}` : 'Book cover preview'}
                referrerPolicy="no-referrer"
                onError={() => setPreviewFailed(true)}
              />
            ) : (
              <ImagePlus size={22} color="var(--af-text-muted)" aria-hidden="true" />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 220 }}>
            <label htmlFor="book-form-image-url" className="af-label">
              Book Cover Image (Optional)
            </label>
            <div className="af-cover-upload-controls">
              <input
                ref={fileInputRef}
                id="book-form-image-file"
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                disabled={submitting}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="af-btn af-btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
              >
                <Upload size={14} aria-hidden="true" />
                <span>{imageUrl ? 'Change Image' : 'Upload Image'}</span>
              </button>

              <input
                id="book-form-image-url"
                type="url"
                className="af-input af-input-rect"
                style={{ flex: 1, minWidth: 180 }}
                placeholder="Or paste an image URL..."
                value={urlInputDisplayValue}
                onChange={(e) => {
                  setPreviewFailed(false);
                  setImageError(null);
                  setImageUrl(e.target.value);
                }}
                disabled={submitting}
              />

              {imageUrl ? (
                <button
                  type="button"
                  className="af-btn af-btn-secondary"
                  onClick={handleClearImage}
                  disabled={submitting}
                  aria-label="Remove cover image"
                >
                  <Trash2 size={14} aria-hidden="true" />
                  <span>Remove</span>
                </button>
              ) : null}
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--af-text-muted)' }}>
              {imageUrl.startsWith('data:')
                ? 'Uploaded image attached and ready to appear in the customer catalogue.'
                : 'Optional for testing: upload a cover file or paste an image link so it appears in the storefront catalogue.'}
            </p>
            {imageError ? <p className="af-field-error">{imageError}</p> : null}
            {previewFailed ? (
              <p className="af-field-error">
                Preview could not load from that link, so a default book cover will be shown instead.
              </p>
            ) : null}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
          <button type="submit" className="af-btn af-btn-primary" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 size={15} className="af-spin" aria-hidden="true" />
                <span>{isEditing ? 'Saving Changes...' : 'Adding Book...'}</span>
              </>
            ) : isEditing ? (
              <>
                <Save size={15} aria-hidden="true" />
                <span>Update Book</span>
              </>
            ) : (
              <>
                <PlusCircle size={15} aria-hidden="true" />
                <span>Add Book to Stock</span>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
