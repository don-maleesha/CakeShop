/**
 * Customer Tier Management System
 * Handles customer tier calculations, benefits, and delivery discounts
 */

class CustomerTierManager {
  constructor() {
    this.tiers = {
      regular: {
        name: 'Regular Customer',
        deliveryDiscount: 0,
        minOrderValue: 0,
        benefits: ['Standard delivery', 'Order tracking', 'Customer support']
      },
      gold: {
        name: 'Gold Member',
        deliveryDiscount: 0.2, // 20% discount
        minOrderValue: 25000, // LKR 25,000 total lifetime orders
        benefits: [
          '20% off delivery fees',
          'Priority customer support',
          'Early access to new products',
          'Birthday special offers'
        ]
      },
      premium: {
        name: 'Premium Member',
        deliveryDiscount: 0.5, // 50% discount
        minOrderValue: 50000, // LKR 50,000 total lifetime orders
        benefits: [
          '50% off all delivery fees',
          'Free express delivery',
          'Dedicated account manager',
          'Exclusive member events',
          'Custom cake consultation',
          'Free delivery on any order value'
        ]
      }
    };
  }

  calculateCustomerTier(totalLifetimeOrders = 0, orderCount = 0) {
    if (totalLifetimeOrders >= this.tiers.premium.minOrderValue) {
      return 'premium';
    }
    if (totalLifetimeOrders >= this.tiers.gold.minOrderValue) {
      return 'gold';
    }
    return 'regular';
  }

  getTierInfo(tier) {
    return this.tiers[tier] || this.tiers.regular;
  }

  calculateDeliveryDiscount(tier, originalFee) {
    const tierInfo = this.getTierInfo(tier);
    const discount = originalFee * tierInfo.deliveryDiscount;
    return {
      originalFee,
      discount,
      finalFee: Math.max(0, originalFee - discount),
      discountPercentage: tierInfo.deliveryDiscount * 100
    };
  }

  getProgressToNextTier(currentSpend, currentTier) {
    const nextTierSpend = currentTier === 'regular' 
      ? this.tiers.gold.minOrderValue 
      : currentTier === 'gold' 
        ? this.tiers.premium.minOrderValue 
        : null;

    if (!nextTierSpend) {
      return null; // Already at highest tier
    }

    const remaining = nextTierSpend - currentSpend;
    const progress = (currentSpend / nextTierSpend) * 100;

    return {
      nextTier: currentTier === 'regular' ? 'gold' : 'premium',
      remaining: Math.max(0, remaining),
      progress: Math.min(100, progress),
      nextTierName: currentTier === 'regular' ? 'Gold Member' : 'Premium Member'
    };
  }

  shouldOfferUpgrade(currentTier, currentSpend) {
    const progress = this.getProgressToNextTier(currentSpend, currentTier);
    if (!progress) return false;

    // Offer upgrade when customer is 80% to next tier
    return progress.progress >= 80;
  }

  getTierBenefitComparison() {
    return Object.entries(this.tiers).map(([key, tier]) => ({
      id: key,
      ...tier,
      discountText: tier.deliveryDiscount > 0 
        ? `${tier.deliveryDiscount * 100}% off delivery` 
        : 'Standard rates'
    }));
  }
}

// Business rules integration for customer tiers
const addCustomerTierRules = (businessRules) => {
  const tierManager = new CustomerTierManager();

  businessRules.addRule('customer.tierCalculation', {
    description: 'Calculate customer tier based on lifetime spending',
    calculate: (totalLifetimeOrders, orderCount) => {
      return tierManager.calculateCustomerTier(totalLifetimeOrders, orderCount);
    }
  });

  businessRules.addRule('customer.deliveryDiscount', {
    description: 'Calculate delivery discount based on customer tier',
    calculate: (tier, originalFee) => {
      return tierManager.calculateDeliveryDiscount(tier, originalFee);
    }
  });

  businessRules.addRule('customer.tierProgress', {
    description: 'Calculate progress to next tier',
    calculate: (currentSpend, currentTier) => {
      return tierManager.getProgressToNextTier(currentSpend, currentTier);
    }
  });

  businessRules.addRule('customer.upgradeOffer', {
    description: 'Determine if customer should be offered tier upgrade',
    validate: (currentTier, currentSpend) => {
      return tierManager.shouldOfferUpgrade(currentTier, currentSpend);
    }
  });
};

module.exports = {
  CustomerTierManager,
  addCustomerTierRules
};
