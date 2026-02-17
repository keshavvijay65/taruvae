/**
 * ORDER CALCULATION UTILITY - SINGLE SOURCE OF TRUTH
 * =====================================================
 * This file contains ALL order calculation logic.
 * DO NOT duplicate these calculations elsewhere.
 * 
 * BUSINESS RULES (STRICT - Indian E-commerce):
 * ============================================
 * 1. Subtotal = sum(item.price × quantity)
 * 2. Discount = coupon discount (capped at subtotal)
 * 3. TaxableAmount = Subtotal − Discount
 * 4. GST = 18% of TaxableAmount (AFTER discount)
 * 5. Shipping = FREE if subtotal ≥ ₹500, else ₹50
 * 6. Total Payable = TaxableAmount + GST + Shipping
 * 
 * COUPON RULES:
 * =============
 * - Coupon applies ONLY if: active, not expired, min order met
 * - Percentage coupon: discount = min(subtotal × %, maxDiscount)
 * - Fixed coupon: discount = flat amount
 * - Discount CANNOT exceed subtotal
 * 
 * IMPORTANT: This EXACT formula is used everywhere:
 * - Cart page UI
 * - Checkout page UI
 * - Razorpay order creation
 * - Database order storage
 */

// ============================================================================
// CONSTANTS - Business Rules
// ============================================================================
export const FREE_SHIPPING_THRESHOLD = 500;
export const SHIPPING_COST = 50;
export const GST_RATE = 0.18; // 18% GST

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
export interface CartItem {
    id: number | string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    originalPrice?: number;
    size?: string;  // Product weight/size (e.g., "500g", "1kg", "250ml")
}

export interface AppliedCoupon {
    code: string;
    discount: number;
    type?: 'percentage' | 'fixed';
    value?: number;
}

export interface CouponData {
    id: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    minAmount?: number;
    maxDiscount?: number;
    isActive: boolean;
    validFrom: string;
    validUntil: string;
    usedCount?: number;
    usageLimit?: number;
}

export interface OrderSummary {
    subtotal: number;       // Sum of all items (before any deductions)
    discount: number;       // Coupon discount amount
    taxableAmount: number;  // Subtotal - Discount (base for GST)
    gst: number;            // 18% of taxableAmount
    shipping: number;       // ₹0 or ₹50
    total: number;          // Final payable = taxableAmount + gst + shipping
    itemCount: number;      // Number of items
}

// ============================================================================
// MAIN CALCULATION FUNCTION - SINGLE SOURCE OF TRUTH
// ============================================================================
/**
 * Calculates the complete order summary.
 * 
 * STRICT CALCULATION ORDER:
 * 1. Subtotal = sum(price × quantity)
 * 2. Discount = coupon.discount (capped at subtotal)
 * 3. TaxableAmount = Subtotal - Discount
 * 4. GST = round(TaxableAmount × 0.18)
 * 5. Shipping = ₹0 if subtotal ≥ 500, else ₹50
 * 6. Total = TaxableAmount + GST + Shipping
 */
export function calculateOrderSummary(
    cartItems: CartItem[],
    appliedCoupon: AppliedCoupon | null = null
): OrderSummary {
    // Guard: Empty or invalid cart
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        return {
            subtotal: 0,
            discount: 0,
            taxableAmount: 0,
            gst: 0,
            shipping: 0,
            total: 0,
            itemCount: 0,
        };
    }

    // STEP 1: Calculate subtotal from cart items
    const subtotal = cartItems.reduce((sum, item) => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        return sum + (price * quantity);
    }, 0);

    // Calculate item count
    const itemCount = cartItems.reduce((count, item) => {
        return count + (Number(item.quantity) || 0);
    }, 0);

    // STEP 2: Apply discount (capped at subtotal, never negative)
    const rawDiscount = appliedCoupon?.discount || 0;
    const discount = Math.min(Math.max(0, rawDiscount), subtotal);

    // STEP 3: Calculate taxable amount (base for GST)
    const taxableAmount = Math.max(0, subtotal - discount);

    // STEP 4: Calculate GST on TAXABLE AMOUNT (after discount)
    const gst = Math.round(taxableAmount * GST_RATE);

    // STEP 5: Calculate shipping (based on original subtotal)
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;

    // STEP 6: Calculate total payable
    // Total = TaxableAmount + GST + Shipping
    const total = Math.max(0, taxableAmount + gst + shipping);

    return {
        subtotal,
        discount,
        taxableAmount,
        gst,
        shipping,
        total,
        itemCount,
    };
}

// ============================================================================
// COUPON DISCOUNT CALCULATOR
// ============================================================================
/**
 * Calculates coupon discount based on coupon type and subtotal.
 * 
 * RULES:
 * - Coupon must be active
 * - Coupon must not be expired
 * - Minimum order amount must be met
 * - Percentage coupon: (subtotal × value / 100), capped at maxDiscount
 * - Fixed coupon: direct value
 * - Discount cannot exceed subtotal
 */
export function calculateCouponDiscount(
    coupon: CouponData | null,
    subtotal: number
): number {
    // Guard: Invalid inputs
    if (!coupon || subtotal <= 0) return 0;

    // Guard: Coupon not active
    if (!coupon.isActive) return 0;

    // Guard: Check expiry dates
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);
    
    if (now < validFrom || now > validUntil) {
        return 0;
    }

    // Guard: Minimum order not met
    if (coupon.minAmount && subtotal < coupon.minAmount) {
        return 0;
    }

    // Guard: Usage limit reached
    if (coupon.usageLimit && coupon.usedCount && coupon.usedCount >= coupon.usageLimit) {
        return 0;
    }

    let discountAmount = 0;

    if (coupon.type === 'percentage') {
        // Percentage discount on subtotal
        discountAmount = Math.round((subtotal * coupon.value) / 100);
        
        // Respect maximum discount cap
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
        }
    } else {
        // Fixed amount discount
        discountAmount = coupon.value;
    }

    // Ensure discount doesn't exceed subtotal
    return Math.min(Math.max(0, discountAmount), subtotal);
}

/**
 * Validates a coupon and returns validation result with error message
 */
export function validateCouponData(
    coupon: CouponData | null,
    subtotal: number
): { valid: boolean; error?: string; discount: number } {
    if (!coupon) {
        return { valid: false, error: 'Coupon not found', discount: 0 };
    }

    if (!coupon.isActive) {
        return { valid: false, error: 'This coupon is not active', discount: 0 };
    }

    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);

    if (now < validFrom) {
        return { valid: false, error: `Coupon valid from ${validFrom.toLocaleDateString('en-IN')}`, discount: 0 };
    }

    if (now > validUntil) {
        return { valid: false, error: 'Coupon has expired', discount: 0 };
    }

    if (coupon.minAmount && subtotal < coupon.minAmount) {
        return { 
            valid: false, 
            error: `Minimum order ₹${coupon.minAmount} required. Your order is ₹${subtotal}`, 
            discount: 0 
        };
    }

    if (coupon.usageLimit && coupon.usedCount && coupon.usedCount >= coupon.usageLimit) {
        return { valid: false, error: 'Coupon usage limit reached', discount: 0 };
    }

    const discount = calculateCouponDiscount(coupon, subtotal);
    
    if (discount <= 0) {
        return { valid: false, error: 'Coupon not applicable', discount: 0 };
    }

    return { valid: true, discount };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Formats a number as Indian Rupee currency string
 */
export function formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Checks if free shipping is available based on subtotal
 */
export function isFreeShipping(subtotal: number): boolean {
    return subtotal >= FREE_SHIPPING_THRESHOLD;
}

/**
 * Gets amount needed for free shipping
 */
export function amountForFreeShipping(subtotal: number): number {
    if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
    return FREE_SHIPPING_THRESHOLD - subtotal;
}

/**
 * Converts rupees to paise for Razorpay
 * Razorpay requires amount in paise (smallest currency unit)
 */
export function rupeesToPaise(rupees: number): number {
    return Math.round(rupees * 100);
}

/**
 * Validates that all order values are consistent
 * Returns true if valid, throws error if not
 */
export function validateOrderConsistency(
    summary: OrderSummary,
    expectedTotal: number
): boolean {
    const calculatedTotal = summary.taxableAmount + summary.gst + summary.shipping;
    
    if (Math.abs(calculatedTotal - summary.total) > 1) {
        throw new Error(`Total mismatch: calculated ${calculatedTotal}, got ${summary.total}`);
    }
    
    if (Math.abs(summary.total - expectedTotal) > 1) {
        throw new Error(`Expected total ${expectedTotal}, got ${summary.total}`);
    }
    
    if (summary.total < 0) {
        throw new Error('Total cannot be negative');
    }
    
    return true;
}
