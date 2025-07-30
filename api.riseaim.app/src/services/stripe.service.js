import Stripe from 'stripe';

const stripe = new Stripe('sk_test_51RpwDoKNHGlalqddWEvhWqmyiSxWXk3e3pS0A16yAMB0L4BntNJokEGVjpoBOYVD7hh5fr4T5LJQTdtSnRcWVC7C00BN9D8F7P')

const StripeService = {
  /**
   * Create a new Stripe Customer
   * @param {string} email
   * @param {string} paymentMethodId
   * @returns {Promise<Stripe.Customer>}
   */
  async createCustomer(email, paymentMethodId) {
    const customer = await stripe.customers.create({
      email,
      payment_method: paymentMethodId,
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
    return customer;
  },

  /**
   * Create a payment intent
   * @param {number} amount
   * @param {string} customerId
   * @param {string} paymentMethodId
   * @param {string} subscriptionPlanId
   * @param {number} quantity
   * @param {string} successUrl
   * @returns {Promise<Stripe.PaymentIntent>}
   */
  async createPaymentIntent(amount, customerId, paymentMethodId, subscriptionPlanId, quantity, successUrl) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // convert to cents
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethodId,
      confirm: true,
      description: `Subscription plan purchase (${subscriptionPlanId}) x${quantity}`,
      metadata: {
        subscriptionPlanId,
        quantity,
      },
      return_url: successUrl,
    });

    return paymentIntent;
  },

  /**
   * Optionally cancel a payment intent
   * @param {string} paymentIntentId
   * @returns {Promise<Stripe.PaymentIntent>}
   */
  async cancelPaymentIntent(paymentIntentId) {
    const canceledIntent = await stripe.paymentIntents.cancel(paymentIntentId);
    return canceledIntent;
  },
};

export default StripeService;
