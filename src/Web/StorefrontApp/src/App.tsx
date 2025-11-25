import { useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import './App.css';
import { chargePayment, checkout, fetchStorefront, login, register } from './api';
import type {
  Category,
  OrderItemPayload,
  PaymentDetails,
  Product,
  UserProfile,
} from './types';

type AuthMode = 'login' | 'register';

type AuthState = {
  userId: string;
  email: string;
  fullName: string;
};

const DEMO_USER = {
  email: 'jane@amazon-demo.com',
  password: 'Sup3rSecure!',
};

type BucketItem = {
  product: Product;
  quantity: number;
};

function App() {
  return (
    <BrowserRouter>
      <StorefrontApp />
    </BrowserRouter>
  );
}

function StorefrontApp() {
  const navigate = useNavigate();
  const [auth, setAuth] = useState<AuthState | null>(() => {
    const cached = localStorage.getItem('storefront.auth');
    return cached ? (JSON.parse(cached) as AuthState) : null;
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [deals, setDeals] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bucket, setBucket] = useState<Record<string, BucketItem>>({});
  const [shippingAddress, setShippingAddress] = useState(
    '410 Terry Ave N, Seattle, WA 98109',
  );
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderMessage, setOrderMessage] = useState<string | null>(null);
  const [orderMessageType, setOrderMessageType] = useState<
    'success' | 'error' | 'info' | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchStorefront(auth?.userId)
      .then((data) => {
        if (cancelled) return;
        setCategories(data.categories);
        setFeatured(data.featured);
        setDeals(data.deals);
        setProfile(data.profile ?? null);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [auth?.userId]);

  const greeting = useMemo(() => {
    if (profile) return `Welcome back, ${profile.fullName}!`;
    if (auth) return `Hi ${auth.fullName}, let's keep shopping.`;
    return 'Welcome to Marketplace';
  }, [auth, profile]);

  const filteredFeatured = useMemo(() => {
    if (!selectedCategory) return featured;
    return featured.filter(
      (p) => p.category.toLowerCase() === selectedCategory?.toLowerCase(),
    );
  }, [featured, selectedCategory]);

  const filteredDeals = useMemo(() => {
    if (!selectedCategory) return deals;
    return deals.filter(
      (p) => p.category.toLowerCase() === selectedCategory?.toLowerCase(),
    );
  }, [deals, selectedCategory]);

  const bucketItems = useMemo(() => Object.values(bucket), [bucket]);
  const bucketTotal = useMemo(
    () =>
      bucketItems.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0,
      ),
    [bucketItems],
  );

  function showMessage(
    message: string | null,
    type: 'success' | 'error' | 'info' | null = null,
  ) {
    setOrderMessage(message);
    setOrderMessageType(type);
  }

  function addToBucket(product: Product) {
    setBucket((prev) => {
      const existing = prev[product.id];
      const nextQuantity = existing ? existing.quantity + 1 : 1;
      return {
        ...prev,
        [product.id]: { product, quantity: nextQuantity },
      };
    });
    showMessage(`${product.title} added to bucket.`, 'info');
  }

  function updateBucket(productId: string, delta: number) {
    setBucket((prev) => {
      const existing = prev[productId];
      if (!existing) {
        return prev;
      }
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }

      return {
        ...prev,
        [productId]: { ...existing, quantity: newQty },
      };
    });
  }

  function handleReviewCheckout() {
    if (!auth) {
      showMessage('Sign in to place an order.', 'error');
      return;
    }

    if (!bucketItems.length) {
      showMessage('Add at least one item to your bucket.', 'error');
      return;
    }

    showMessage(null, null);
    navigate('/checkout');
  }

  async function handlePlaceOrder(payment: PaymentDetails) {
    if (!auth) {
      showMessage('Sign in to place an order.', 'error');
      navigate('/');
      return;
    }

    if (!bucketItems.length) {
      showMessage('Your bucket is empty.', 'error');
      navigate('/');
      return;
    }

    setPlacingOrder(true);
    showMessage(null, null);
    try {
      await chargePayment(bucketTotal, payment);

      const items: OrderItemPayload[] = bucketItems.map((item) => ({
        productId: item.product.id,
        title: item.product.title,
        quantity: item.quantity,
        unitPrice: item.product.price,
      }));

      const order = await checkout(auth.userId, items, shippingAddress);
      showMessage(
        `Order ${order.id.slice(0, 8)} placed! Total $${order.total.toFixed(
          2,
        )}.`,
        'success',
      );
      setBucket({});
      navigate('/');
    } catch (err) {
      showMessage(
        err instanceof Error ? err.message : 'Checkout failed. Try again.',
        'error',
      );
    } finally {
      setPlacingOrder(false);
    }
  }

  function clearBucket() {
    setBucket({});
    showMessage('Bucket cleared.', 'info');
  }

  async function handleAuthSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result =
        authMode === 'login'
          ? await login(formEmail, formPassword)
          : await register(formEmail, formPassword, fullName);
      const state: AuthState = {
        userId: result.userId,
        email: result.email,
        fullName: result.fullName,
      };
      setAuth(state);
      localStorage.setItem('storefront.auth', JSON.stringify(state));
      setFormPassword('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  function handleDemoCredentials() {
    setFormEmail(DEMO_USER.email);
    setFormPassword(DEMO_USER.password);
    setAuthMode('login');
  }

  function handleSignOut() {
    setAuth(null);
    setProfile(null);
    localStorage.removeItem('storefront.auth');
  }

  return (
    <div className="app-shell">
      <header>
        <h1>Marketplace</h1>
        <div className="header-actions">
          <span className="tier-pill">
            {profile?.tier ?? 'Guest'} ·{' '}
            {profile ? `${profile.loyaltyPoints} pts` : 'Sign in for perks'}
          </span>
          {auth ? (
            <button className="ghost-btn" onClick={handleSignOut}>
              Sign out
            </button>
          ) : (
            <button className="ghost-btn" onClick={handleDemoCredentials}>
              Use demo login
            </button>
          )}
        </div>
      </header>

      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              greeting={greeting}
              auth={auth}
              authMode={authMode}
              setAuthMode={setAuthMode}
              formEmail={formEmail}
              setFormEmail={setFormEmail}
              formPassword={formPassword}
              setFormPassword={setFormPassword}
              fullName={fullName}
              setFullName={setFullName}
              submitting={submitting}
              onAuthSubmit={handleAuthSubmit}
              onUseDemo={handleDemoCredentials}
              error={error}
              loading={loading}
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              filteredFeatured={filteredFeatured}
              filteredDeals={filteredDeals}
              addToBucket={addToBucket}
              bucketItems={bucketItems}
              bucketTotal={bucketTotal}
              updateBucket={updateBucket}
              clearBucket={clearBucket}
              orderMessage={orderMessage}
              orderMessageType={orderMessageType}
              onReviewCheckout={handleReviewCheckout}
            />
          }
        />
        <Route
          path="/checkout"
          element={
            <CheckoutPage
              authEmail={auth?.email ?? 'guest'}
              bucketItems={bucketItems}
              bucketTotal={bucketTotal}
              shippingAddress={shippingAddress}
              setShippingAddress={setShippingAddress}
              orderMessage={orderMessage}
              orderMessageType={orderMessageType}
              placingOrder={placingOrder}
              onBack={() => navigate('/')}
              onPlaceOrder={handlePlaceOrder}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <footer>
        <p>Built with .NET microservices · Gateway: http://localhost:5401</p>
      </footer>
    </div>
  );
}

type HomePageProps = {
  greeting: string;
  auth: AuthState | null;
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  formEmail: string;
  setFormEmail: (value: string) => void;
  formPassword: string;
  setFormPassword: (value: string) => void;
  fullName: string;
  setFullName: (value: string) => void;
  submitting: boolean;
  onAuthSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onUseDemo: () => void;
  error: string | null;
  loading: boolean;
  categories: Category[];
  selectedCategory: string | null;
  setSelectedCategory: Dispatch<SetStateAction<string | null>>;
  filteredFeatured: Product[];
  filteredDeals: Product[];
  addToBucket: (product: Product) => void;
  bucketItems: BucketItem[];
  bucketTotal: number;
  updateBucket: (productId: string, delta: number) => void;
  clearBucket: () => void;
  orderMessage: string | null;
  orderMessageType: 'success' | 'error' | 'info' | null;
  onReviewCheckout: () => void;
};

function HomePage({
  greeting,
  auth,
  authMode,
  setAuthMode,
  formEmail,
  setFormEmail,
  formPassword,
  setFormPassword,
  fullName,
  setFullName,
  submitting,
  onAuthSubmit,
  onUseDemo,
  error,
  loading,
  categories,
  selectedCategory,
  setSelectedCategory,
  filteredFeatured,
  filteredDeals,
  addToBucket,
  bucketItems,
  bucketTotal,
  updateBucket,
  clearBucket,
  orderMessage,
  orderMessageType,
  onReviewCheckout,
}: HomePageProps) {
  const bannerClass =
    orderMessageType === 'success'
      ? 'success-banner'
      : orderMessageType === 'error'
      ? 'error-banner'
      : orderMessageType === 'info'
      ? 'info-banner'
      : null;

  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">Prime-style experience</p>
          <h2>{greeting}</h2>
          <p>
            Browse curated categories, Prime deals, and your personalized
            storefront backed by microservices.
          </p>
        </div>
        {!auth && (
          <form className="auth-card" onSubmit={onAuthSubmit}>
            <div className="segmented">
              <button
                type="button"
                className={authMode === 'login' ? 'active' : ''}
                onClick={() => setAuthMode('login')}
              >
                Sign in
              </button>
              <button
                type="button"
                className={authMode === 'register' ? 'active' : ''}
                onClick={() => setAuthMode('register')}
              >
                Join Prime
              </button>
            </div>
            <label>
              Email
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                required
              />
            </label>
            {authMode === 'register' && (
              <label>
                Full name
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </label>
            )}
            <button type="submit" disabled={submitting}>
              {submitting
                ? 'Processing...'
                : authMode === 'login'
                ? 'Sign in'
                : 'Create account'}
            </button>
            <button type="button" className="ghost-btn small" onClick={onUseDemo}>
              Use demo login
            </button>
          </form>
        )}
      </section>

      {error && <p className="error-banner">{error}</p>}
      {loading && <p className="muted">Loading storefront...</p>}

      {!loading && (
        <>
          <section>
            <div className="section-header">
              <div>
                <h3>Featured categories</h3>
                <p className="muted">
                  {selectedCategory
                    ? `Showing ${selectedCategory} results`
                    : 'Tap a category to personalize the grid'}
                </p>
              </div>
              {selectedCategory && (
                <button
                  className="ghost-btn small"
                  onClick={() => setSelectedCategory(null)}
                >
                  Clear filter
                </button>
              )}
            </div>
            <div className="categories">
              {categories.map((category) => (
                <button
                  key={category.name}
                  className={`category-pill${
                    selectedCategory === category.name ? ' active' : ''
                  }`}
                  onClick={() =>
                    setSelectedCategory((prev) =>
                      prev === category.name ? null : category.name,
                    )
                  }
                >
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <SectionHeader
              title="Featured Products"
              subtitle="Highly rated picks just for you"
            />
            <ProductGrid products={filteredFeatured} onAdd={addToBucket} />
          </section>

          <section>
            <SectionHeader
              title="Trending Deals"
              subtitle="Fresh markdowns inspired by Prime Day"
            />
            <ProductGrid
              products={filteredDeals}
              showSavings
              onAdd={addToBucket}
            />
          </section>

          <section>
            <SectionHeader
              title="Your bucket"
              subtitle={
                bucketItems.length
                  ? `${bucketItems.length} items · $${bucketTotal.toFixed(2)}`
                  : 'Add items to begin checkout'
              }
            />

            {orderMessage && bannerClass && (
              <p className={bannerClass}>{orderMessage}</p>
            )}

            <div className="bucket-card">
              {bucketItems.length === 0 && (
                <p className="muted">
                  Browse the featured sections and tap “Add to bucket” to build
                  your cart.
                </p>
              )}

              {bucketItems.map(({ product, quantity }) => (
                <div key={product.id} className="bucket-row">
                  <div>
                    <h4>{product.title}</h4>
                    <p className="muted">
                      {quantity} × ${product.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="bucket-actions">
                    <button
                      className="ghost-btn small"
                      onClick={() => updateBucket(product.id, -1)}
                    >
                      −
                    </button>
                    <span>{quantity}</span>
                    <button
                      className="ghost-btn small"
                      onClick={() => updateBucket(product.id, 1)}
                    >
                      +
                    </button>
                    <button
                      className="ghost-btn small"
                      onClick={() => updateBucket(product.id, -quantity)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              <div className="bucket-footer">
                <button
                  className="ghost-btn small"
                  onClick={clearBucket}
                  disabled={!bucketItems.length}
                >
                  Clear bucket
                </button>
                <button
                  className="primary-btn"
                  onClick={onReviewCheckout}
                  disabled={!bucketItems.length}
                >
                  Review & checkout · ${bucketTotal.toFixed(2)}
                </button>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

type CheckoutPageProps = {
  authEmail: string;
  bucketItems: BucketItem[];
  bucketTotal: number;
  shippingAddress: string;
  setShippingAddress: (value: string) => void;
  orderMessage: string | null;
  orderMessageType: 'success' | 'error' | 'info' | null;
  placingOrder: boolean;
  onBack: () => void;
  onPlaceOrder: (details: PaymentDetails) => void;
};

function CheckoutPage({
  authEmail,
  bucketItems,
  bucketTotal,
  shippingAddress,
  setShippingAddress,
  orderMessage,
  orderMessageType,
  placingOrder,
  onBack,
  onPlaceOrder,
}: CheckoutPageProps) {
  const [cardHolder, setCardHolder] = useState(authEmail);
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('123');
  const [email, setEmail] = useState(authEmail);
  const bannerClass =
    orderMessageType === 'success'
      ? 'success-banner'
      : orderMessageType === 'error'
      ? 'error-banner'
      : orderMessageType === 'info'
      ? 'info-banner'
      : null;

  if (!bucketItems.length) {
    return (
      <main>
        <p className="muted">
          Your bucket is empty. Head back to the storefront to add items.
        </p>
        <button className="primary-btn" onClick={onBack}>
          Return to storefront
        </button>
      </main>
    );
  }

  return (
    <main>
      <section className="checkout-review">
        <SectionHeader
          title="Confirm your order"
          subtitle="Verify shipping and items before billing"
        />

        {orderMessage && bannerClass && (
          <p className={bannerClass}>{orderMessage}</p>
        )}

        <div className="review-grid">
          <div>
            <h4>Shipping details</h4>
            <label className="shipping-field">
              Address
              <input
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
              />
            </label>
            <p className="muted">Signed in as {authEmail}.</p>
          </div>
          <div>
            <h4>Payment method</h4>
            <form
              className="payment-form"
              onSubmit={(e) => {
                e.preventDefault();
                onPlaceOrder({
                  cardHolder,
                  cardNumber,
                  expiry,
                  cvv,
                  email,
                });
              }}
            >
              <label>
                Card holder
                <input
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  required
                />
              </label>
              <label>
                Card number
                <input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  required
                />
              </label>
              <div className="payment-row">
                <label>
                  Expiry
                  <input
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    required
                  />
                </label>
                <label>
                  CVV
                  <input
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    required
                  />
                </label>
              </div>
              <label>
                Receipt email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <p className="muted">
                Demo gateway accepts any card details. Use “4242 4242 4242 4242”
                and any future expiry.
              </p>
            </form>
          </div>
          <div>
            <h4>Items</h4>
            <ul>
              {bucketItems.map(({ product, quantity }) => (
                <li key={product.id}>
                  {quantity} × {product.title}
                </li>
              ))}
            </ul>
            <p className="muted">
              Total due <strong>${bucketTotal.toFixed(2)}</strong>
            </p>
          </div>
        </div>

        <div className="bucket-footer">
          <button className="ghost-btn small" onClick={onBack}>
            Modify cart
          </button>
          <button
            className="primary-btn"
            onClick={() =>
              onPlaceOrder({ cardHolder, cardNumber, expiry, cvv, email })
            }
            disabled={placingOrder}
          >
            {placingOrder ? 'Placing order...' : 'Confirm billing'}
          </button>
        </div>
      </section>
    </main>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="section-header">
      <div>
        <h3>{title}</h3>
        <p className="muted">{subtitle}</p>
      </div>
      <button className="ghost-btn small">View all</button>
    </div>
  );
}

function ProductGrid({
  products,
  showSavings = false,
  onAdd,
}: {
  products: Product[];
  showSavings?: boolean;
  onAdd?: (product: Product) => void;
}) {
  if (!products.length) {
    return <p className="muted">No products available.</p>;
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <article key={product.id} className="product-card">
          <img src={product.imageUrl} alt={product.title} loading="lazy" />
          <div>
            <p className="eyebrow">{product.category}</p>
            <h4>{product.title}</h4>
            <p className="muted">{product.description}</p>
            <div className="price-row">
              <span className="price">${product.price.toFixed(2)}</span>
              {product.listPrice && showSavings && (
                <span className="strike">
                  ${product.listPrice.toFixed(2)}
                </span>
              )}
            </div>
            <p className="muted">
              ⭐ {product.rating.toFixed(1)} ·{' '}
              {product.isPrimeEligible ? 'Prime eligible' : 'Ships free'}
            </p>
            {onAdd && (
              <button className="primary-btn full" onClick={() => onAdd(product)}>
                Add to bucket
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

export default App;
