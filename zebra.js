(function () {
	"use strict";

	var DEFAULT_FORMAT = /(\d{1,4})/g;
	var MIN_CVC_LENGTH = 3;
	var MAX_CVC_LENGTH = 4;

	var cards = {
		maestro: {
			type: "maestro",
			name: "Maestro",
			pattern: /^(5018|5020|5038|6304|6759|676[1-3])/,
			format: DEFAULT_FORMAT,
			lengths: [12, 13, 14, 15, 16, 17, 18, 19],
			cvcLengths: [MIN_CVC_LENGTH],
			luhn: true
		},
		dinersclub: {
			type: "dinersclub",
			name: "Diner’s Club",
			pattern: /^(36|38|30[0-5])/,
			format: DEFAULT_FORMAT,
			lengths: [14],
			cvcLengths: [MIN_CVC_LENGTH],
			luhn: true
		},
		laser: {
			type: "laser",
			name: "Laser",
			pattern: /^(6706|6771|6709)/,
			format: DEFAULT_FORMAT,
			lengths: [16, 17, 18, 19],
			cvcLengths: [MIN_CVC_LENGTH],
			luhn: true
		},
		jcb: {
			type: "jcb",
			name: "JCB",
			pattern: /^35/,
			format: DEFAULT_FORMAT,
			lengths: [15, 16],
			cvcLengths: [MIN_CVC_LENGTH],
			luhn: true
		},
		unionpay: {
			type: "unionpay",
			name: "UnionPay",
			pattern: /^62/,
			format: DEFAULT_FORMAT,
			lengths: [16],
			cvcLengths: [MIN_CVC_LENGTH],
			luhn: false
		},
		discover: {
			type: "discover",
			name: "Discover",
			pattern: /^(6011|65|64[4-9]|622[1-9])/,
			format: DEFAULT_FORMAT,
			lengths: [16],
			cvcLengths: [MIN_CVC_LENGTH],
			luhn: true
		},
		mastercard: {
			type: "mastercard",
			name: "MasterCard",
			pattern: /^5[0-5]/,
			format: DEFAULT_FORMAT,
			lengths: [16],
			cvcLengths: [MIN_CVC_LENGTH],
			luhn: true
		},
		amex: {
			type: "amex",
			name: "American Express",
			pattern: /^3[47]/,
			format: /(\d{1,4})(\d{1,6})?(\d{1,5})?/,
			lengths: [15],
			cvcLengths: [MIN_CVC_LENGTH, MAX_CVC_LENGTH],
			luhn: true
		},
		visa: {
			type: "visa",
			name: "Visa",
			pattern: /^4/,
			format: DEFAULT_FORMAT,
			lengths: [13, 16],
			cvcLengths: [MIN_CVC_LENGTH],
			luhn: true
		}
	};

	var normalize = function (number) {
		return String(number).replace(/\D/g, "");
	};

	var cardFromNumber = function(number) {
		for (var type in cards) {
			if (cards.hasOwnProperty(type)) {
				if (cards[type].pattern.test(number)) {
					return cards[type];
				}
			}
		}
		return null;
	};

	var luhnCheck = function(number) {
		var digit, digits, odd, sum, _i, _len;
		odd = true;
		sum = 0;
		digits = (number + "").split("").reverse();
		for (_i = 0, _len = digits.length; _i < _len; _i++) {
			digit = digits[_i];
			digit = parseInt(digit, 10);
			if ((odd = !odd)) {
				digit *= 2;
			}
			if (digit > 9) {
				digit -= 9;
			}
			sum += digit;
		}
		return sum % 10 === 0;
	};

	var Zebra = {
		formatCardNumber: function (number) {
			number = normalize(number);
			var card = cardFromNumber(number);
			if ( !card ) {
				return number;
			}
			number = number.slice(0, Math.max.apply(null, card.lengths));
			var groups = card.format.exec(number);
			if ( !groups ) {
				return number;
			}
			groups.shift();
			return groups.join(" ");
		},

		cardType: function (number) {
			var card = cardFromNumber(normalize(number));
			return card ? card.type : null;
		},

		cardName: function (number) {
			var card = cardFromNumber(normalize(number));
			return card ? card.name : null;
		},

		validateCardNumber: function (number) {
			number = normalize(number);
			if (number.length === 0) {
				return false;
			}
			var card = cardFromNumber(number);
			if ( !card ) {
				return false;
			}
			if (card.lengths.indexOf(number.length) === -1) {
				return false;
			}
			if (card.luhn) {
				return luhnCheck(number);
			} else {
				return true;
			}
		},

		validateCardExpiry: function (month, year) {
			month = normalize(month);
			year = normalize(year);
			if (month.length === 0 || year.length === 0) {
				return false;
			}
			if (Number(month) > 12) {
				return false;
			}
			var now = new Date();
			if (year.length === 2) {
				year = String(now.getFullYear()).slice(0, 2) + year;
			}
			// months are 0 based in JavaScript,
			// but we want to check against the following month
			// as the card expires at the end of a month
			// (the year is automatically incremented when month > 11)
			var expiry = new Date(Number(year), Number(month));
			return expiry > now;
		},

		validateCardCVC: function (cvc, type) {
			cvc = normalize(cvc);
			if (cvc.length < MIN_CVC_LENGTH || cvc.length > MAX_CVC_LENGTH) {
				return false;
			}
			if (type) {
				var card = cards[type.toLowerCase()];
				if (card) {
					return card.cvcLengths.indexOf(cvc.length) !== -1;
				}
			}
			return true;
		},

		createToken: function (data, callback) {
			var apiKey = data.api_key || "";
			var params = {
				"card[number]": data.number || "",
				"card[exp_month]": data.exp_month || "",
				"card[exp_year]": data.exp_year || "",
				"card[cvc]": data.cvc || ""
			};
			if (data.name) {
				params["card[name]"] = data.name;
			}
			params = Object.keys(params).map(function (k) {
				return k +"="+ encodeURIComponent(params[k]);
			}).join("&");
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function () {
				if (xhr.readyState !== 4) {
					return;
				}
				var response = JSON.parse(xhr.responseText);
				callback(response, xhr);
			};
			xhr.open("POST", "https://api.stripe.com/v1/tokens?"+ params, true);
			xhr.setRequestHeader("Authorization", "Bearer "+ apiKey);
			xhr.send();
		}
	};

	if (typeof window !== "undefined") {
		window.Zebra = Zebra;
	}

})();
