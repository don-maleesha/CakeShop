const crypto = require('crypto');

class PayHereService {
  constructor() {
    this.merchantId = '1231730';
    this.merchantSecret = 'MTM2MzgzOTUxNzM5MjEyMjYzNTEzODUyOTcyMTY4MTA0NzYzMzgwOA==';
    this.sandboxUrl = 'https://sandbox.payhere.lk/pay/checkout';
    this.liveUrl = 'https://www.payhere.lk/pay/checkout';
    this.currency = 'LKR';
  }

  generateHash(merchantId, orderId, amount, currency, merchantSecret) {
    // Hash generation as per PayHere documentation:
    // hash = to_upper_case(md5(merchant_id + order_id + amount + currency + to_upper_case(md5(merchant_secret))))
    
    // First hash the merchant secret and convert to uppercase
    const secretHash = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
    
    // Create the main hash string: merchant_id + order_id + amount + currency + secret_hash
    const hashString = merchantId + orderId + parseFloat(amount).toFixed(2) + currency + secretHash;
    
    // Generate final hash and convert to uppercase
    return crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();
  }

  createPaymentRequest(orderData) {
    const {
      orderId,
      amount,
      customerName,
      email,
      phone,
      address,
      city
    } = orderData;

    const names = customerName.split(' ');
    const firstName = names[0] || '';
    const lastName = names.slice(1).join(' ') || '';

    const paymentData = {
      sandbox: process.env.NODE_ENV !== 'production',
      merchant_id: this.merchantId,
      return_url: undefined, // Important for JS SDK
      cancel_url: undefined, // Important for JS SDK  
      notify_url: `http://localhost:4000/payment/notify`,
      order_id: orderId,
      items: `Cake Order - ${orderId}`,
      currency: this.currency,
      amount: parseFloat(amount).toFixed(2),
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      address: address,
      city: city,
      country: 'Sri Lanka',
      delivery_address: address,
      delivery_city: city,
      delivery_country: 'Sri Lanka',
      custom_1: '',
      custom_2: ''
    };

    // Generate hash using the correct formula
    paymentData.hash = this.generateHash(
      this.merchantId,
      orderId,
      amount,
      this.currency,
      this.merchantSecret
    );

    return paymentData;
  }

  verifyPayment(merchantId, orderId, amount, currency, statusCode, md5sig) {
    // First hash the merchant secret
    const secretHash = crypto.createHash('md5').update(this.merchantSecret).digest('hex').toUpperCase();
    
    // Create the verification hash string
    const hashString = merchantId + orderId + parseFloat(amount).toFixed(2) + currency + statusCode + secretHash;
    
    // Generate verification hash
    const computedHash = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();
    
    return computedHash === md5sig.toUpperCase();
  }

  getPaymentUrl() {
    return process.env.NODE_ENV === 'production' ? this.liveUrl : this.sandboxUrl;
  }
}

module.exports = new PayHereService();
