export type Category = {
  name: string;
  heroImage: string;
};

export type Product = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  listPrice?: number;
  rating: number;
  isPrimeEligible: boolean;
  imageUrl: string;
};

export type StorefrontSnapshot = {
  categories: Category[];
  featured: Product[];
  deals: Product[];
  profile?: UserProfile | null;
};

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  tier: string;
  loyaltyPoints: number;
};

export type AuthenticateResponse = {
  userId: string;
  email: string;
  fullName: string;
  token: string;
};

export type OrderItemPayload = {
  productId: string;
  title: string;
  quantity: number;
  unitPrice: number;
};

export type OrderDto = {
  id: string;
  userId: string;
  createdOn: string;
  status: string;
  total: number;
  items: OrderItemPayload[];
};

export type PaymentDetails = {
  cardHolder: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  email: string;
};

export type PaymentChargeResponse = {
  transactionId: string;
  status: string;
  processedAt: string;
};

