Zebra
=====

![magnetic_stripe_prototype](https://cloud.githubusercontent.com/assets/171040/2937244/e2c49370-d891-11e3-9115-5c3a07bfed33.jpg)

An alternative to [Stripe.js](https://stripe.com/docs/stripe.js) for card validation and token creation.

Heavily based off of [stripe/jquery.payment](https://github.com/stripe/jquery.payment).

This library uses [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS) for the token creation.

## Usage

```javascript
Zebra.formatCardNumber("4242424242424242") //=> "4242 4242 4242 4242"
Zebra.cardType("4242 4242 4242 4242") //=> "visa"
Zebra.cardName("4242 4242 4242 4242") //=> "Visa"
Zebra.validateCardNumber("4242 4242 4242 4242") //=> true
Zebra.validateCardExpiry("12", "2050") //=> true
Zebra.validateCardExpiry("12", "50") //=> true
Zebra.validateCardExpiry("14", "2050") //=> false
Zebra.validateCardCVC("123") //=> true
Zebra.validateCardCVC("123", "amex") //=> true
Zebra.validateCardCVC("1234", "amex") //=> true
Zebra.validateCardCVC("12345") //=> false
Zebra.createToken({
	api_key: "YOUR_SECRET_KEY",
	number: "4242 4242 4242 4242",
	exp_month: "12",
	exp_year: "2050",
	cvc: "123",
	name: "Alex Smith" // name is optional
}, function (res, xhr) {});
```
