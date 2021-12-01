import React, { Component } from 'react'
import { CardStyleInterpolators } from 'react-navigation-stack'
import {
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
  Text,
  I18nManager,
  Alert,
  Button,
  Pressable
} from 'react-native'
import RNPaypal from 'react-native-paypal-lib'
import { UIActivityIndicator } from 'react-native-indicators'
import Toast from 'react-native-easy-toast'
import HTML from 'react-native-render-html'
import ModalWrapper from 'react-native-modal-wrapper'
import Spinner from 'react-native-loading-spinner-overlay'
import WooComFetch, { getUrl, getHttp, postHttp ,getAllBanners,postOrder} from '../common/WooComFetch'
import couponProvider from '../common/CouponClass'
import { Icon } from 'native-base'
import SyncStorage from 'sync-storage'
import { connect } from 'react-redux'
import ImageLoad from '../common/RnImagePlaceH'
import themeStyle from '../common/Theme.style'
import stripe from 'tipsi-stripe'
import RazorpayCheckout from 'react-native-razorpay'
import CardTextFieldScreen from '../PaymentMethods/Stripe/scenes/CardTextFieldScreen'
import { StackActions, NavigationActions } from 'react-navigation'
const paytmConfig = {
  MID: 'rxazcv89315285244163',
  WEBSITE: 'WEBSTAGING',
  CHANNEL_ID: 'WAP',
  INDUSTRY_TYPE_ID: 'Retail',
  CALLBACK_URL: 'https://securegw.paytm.in/theia/paytmCallback?ORDER_ID='
}

import IPay88, { Pay } from "react-native-ipay88-integration";

class orderScreen extends Component {
  static navigationOptions = ({ navigation }) => {
    const headerStyle = navigation.getParam('headerTitle')
    return {
      headerTitle: headerStyle,
      cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      headerTitleAlign: 'center',
      headerTintColor: themeStyle.headerTintColor,
      headerStyle: {
        backgroundColor: themeStyle.primary
      },
      headerTitleStyle: {
        fontWeight: Platform.OS === 'android' ? 'bold' : 'normal'
      },
      headerForceInset: { top: 'never', vertical: 'never' },
      gestureEnabled: true
    }
  }

  

  constructor (props) {
    super(props)
    this.state = {
      customerNotes: '',
      discount: 0,
      productsTotal: 0,
      totalAmountWithDisocunt: 0,
      paymentMethods: [],
      selectedPaymentMethod: '',
      selectedPaymentMethodTitle: '',
      order: {},
      tax: 0,
      loaderTaxCalculating: true,
      loaderPaymentMethods: true,
      wrapperCondition: false,
      wrapperCondition2: false,
      radioButton: [],
      paymentText: '',
      paymentShowCondition: true,
      buttonEnable: false,
      couponArray: [],
      couponApplied: 0,
      tokenFromServer: null,
      token: '',
      couponText: '',
      nonce: '',
      stripeCard: {
        number: '',
        expMonth: 1,
        expYear: 2020,
        cvc: ''
      },
      params: {
        number: '',
        expMonth: 0,
        expYear: 0,
        cvc: ''
      },
      paypalClientId: '',
      paypalEnviroment: '',
      paytmEnviroment: '',
      publicKeyStripe: '',
      razorPayKey: '',
      mid: '',
      method: [],
      orderDetail: JSON.parse(JSON.stringify(SyncStorage.get('orderDetails'))),
      products: JSON.parse(JSON.stringify(SyncStorage.get('cartProducts')))
    }
  }

  payTmFUn = async () => {
    const dat = {}
    dat.customers_id = SyncStorage.get('customerData').customers_id
    dat.amount = this.state.totalAmountWithDisocunt
    const data = await getHttp(
      getUrl() +
        '/api/' +
        'generatpaytmhashes?customers_id=' +
        SyncStorage.get('customerData').customers_id +
        '&amount' +
        this.state.totalAmountWithDisocunt
    )
    this.runTransaction(
      this.state.totalAmountWithDisocunt.toString(),
      SyncStorage.get('customerData').customers_id.toString(),
      data.data.data.ORDER_ID.toString(),
      SyncStorage.get('customerData').customers_telephone,
      SyncStorage.get('customerData').email,
      data.data.data.CHECKSUMHASH,
      '1587028733'
    )
    this.setState({ SpinnerTemp: false })
  }

  runTransaction (amount, customerId, orderId, mobile, email, checkSum) {
    const callbackUrl = `${paytmConfig.CALLBACK_URL}${orderId}`
    const details = {
      mode: this.state.paytmEnviroment, // 'Staging' or 'Production'
      MID: this.state.mid,
      INDUSTRY_TYPE_ID: paytmConfig.INDUSTRY_TYPE_ID,
      WEBSITE: paytmConfig.WEBSITE,
      CHANNEL_ID: paytmConfig.CHANNEL_ID,
      TXN_AMOUNT: `${amount}`, // String
      ORDER_ID: orderId, // String
      EMAIL: email, // String
      MOBILE_NO: mobile, // String
      CUST_ID: customerId, // String
      CHECKSUMHASH: checkSum, // From your server using PayTM Checksum Utility
      CALLBACK_URL: callbackUrl
    }
    // Paytm.startPayment(details)
  }

  /// ///
  onPayTmResponse = resp => {
    const { STATUS, status, response } = resp
    if (Platform.OS === 'ios') {
      if (status === 'Success') {
        const jsonResponse = JSON.parse(response)
        const { STATUS } = jsonResponse

        if (STATUS && STATUS === 'TXN_SUCCESS') {
          // Payment succeed!
        }
      }
    } else {
      if (STATUS && STATUS === 'TXN_SUCCESS') {
        // Payment succeed!
      }
    }
  }

  /// ///////
  paypayMethod = () => {
    RNPaypal.paymentRequest({
      clientId: this.state.paypalClientId,
      environment: RNPaypal.ENVIRONMENT.NO_NETWORK,
      intent: RNPaypal.INTENT.SALE,
      price: this.state.totalAmountWithDisocunt,
      currency: this.props.cartItems2.Config.productsArguments.currency.toString(),
      description: 'Total Amount',
      acceptCreditCards: true
    })
      .then(response => {
        this.setState({ SpinnerTemp: true, token: response.response.id }, () =>
          this.addOrder()
        )
      })
      .catch(err => {
        this.refs.toast.show(err.message)
      })
  }

  /// ///////////////////////////////////
  setTokenFun = token => {
    this.setState({ token: token })
  }

  setParams = params => {
    this.setState({ params: params })
  }

  calculateTotal = function () {
    let a = 0
    for (const value of this.state.products) {
      var subtotal = parseFloat(value.total)
      a = a + subtotal
    }

    const b = parseFloat(this.state.orderDetail.total_tax.toString())
    const c = parseFloat(this.state.orderDetail.shipping_cost.toString())
    this.state.totalAmountWithDisocunt = parseFloat(
      (parseFloat(a.toString()) + b + c).toString()
    )
    this.calculateDiscount()
  }
  /// ////////////////////////////////////

  calculateDiscount = () => {
    var subTotal = 0
    var total = 0
    for (const value of this.state.products) {
      subTotal += parseFloat(value.subtotal)
      total += value.total
    }
    this.state.productsTotal = subTotal
    this.state.discount = subTotal - total
    this.setState({
      discount: this.state.discount,
      productsTotal: this.state.productsTotal,
      couponText: ''
    })
  }

  initializePaymentMethods = async () => {
    var dat = {}
    dat.language_id =
      SyncStorage.get('langId') === undefined ? 1 : SyncStorage.get('langId')
    dat.currency_code = this.props.cartItems2.Config.productsArguments.currency

    const data = await WooComFetch.postHttp(
      getUrl() + '/api/' + 'getpaymentmethods',
      dat
    )
    if (data.success == 1) {
      for (const a of data.data.data) {
        if (
          a.method !== 'braintree_card' &&
          a.method !== 'braintree_paypal' &&
          a.method !== 'instamojo' &&
          a.method !== 'hyperpay' &&
          a.method !== 'paytm'
          //  &&
          // a.method !== 'razorpay'
        ) {
          this.state.paymentMethods.push(a)
          this.state.method.push(a.method)
        }

        if (a.method == 'paypal' && a.active == '1') {
          this.state.paypalClientId = a.public_key
          if (a.environment == 'Test') { this.state.paypalEnviroment = 'PayPalEnvironmentSandbox' } else this.state.paypalEnviroment = 'PayPalEnvironmentProduction'
        }
        if (a.method == 'stripe' && a.active == '1') {
          this.state.publicKeyStripe = a.public_key
          stripe.setOptions({
            publishableKey: a.public_key
          })
        }
        if (a.method == 'paytm' && a.active == '1') {
          this.state.mid = a.public_key
          if (a.environment == 'Test') this.state.paytmEnviroment = 'Staging'
          else this.state.paytmEnviroment = 'Production'
        }
        if (a.method == 'razorpay' && a.active == '1') {
          this.state.razorPayKey = a.public_key
        }
      }
    }

    this.setState({ paymentShowCondition: false })
  }
  

  handleCustomPayPress = async params => {
    const token = await stripe.createTokenWithCard(params)
    this.setTokenFun(token.tokenId)
  }


  addOrder = async () => {
    if (SyncStorage.get('orderDetails').payment_method === 'stripe') { await this.handleCustomPayPress(this.state.params) }
    const orderDetail = SyncStorage.get('orderDetails')
    orderDetail.customers_id =
      SyncStorage.get('customerData').customers_id === undefined
        ? 1
        : SyncStorage.get('customerData').customers_id
    orderDetail.customers_name =
      SyncStorage.get('orderDetails').delivery_firstname +
      ' ' +
      SyncStorage.get('orderDetails').delivery_lastname
    orderDetail.delivery_name =
      SyncStorage.get('orderDetails').billing_firstname +
      ' ' +
      SyncStorage.get('orderDetails').billing_lastname
    if (SyncStorage.get('orderDetails').guest_status == 1) {
      orderDetail.email =
        SyncStorage.get('customerData').email === undefined ||
        SyncStorage.get('customerData').email === ''
          ? 'guest@gmail.com'
          : SyncStorage.get('customerData').email
      orderDetail.customers_telephone =
        SyncStorage.get('orderDetails').delivery_phone === undefined ||
          SyncStorage.get('orderDetails').delivery_phone === ''
          ? '123123231312'
          : SyncStorage.get('orderDetails').delivery_phone
      orderDetail.delivery_phone =
          SyncStorage.get('orderDetails').delivery_phone === undefined ||
          SyncStorage.get('orderDetails').delivery_phone === ''
            ? '123123231312'
            : SyncStorage.get('orderDetails').delivery_phone
    } else {
      orderDetail.email =
        SyncStorage.get('customerData').email === undefined ||
        SyncStorage.get('customerData').email === ''
          ? 'guest@gmail.com'
          : SyncStorage.get('customerData').email
      orderDetail.customers_telephone =
        SyncStorage.get('customerData').customers_telephone === undefined ||
          SyncStorage.get('orderDetails').delivery_phone === ''
          ? '123123231312'
          : SyncStorage.get('customerData').customers_telephone
      orderDetail.delivery_phone =
          SyncStorage.get('orderDetails').delivery_phone === undefined ||
          SyncStorage.get('orderDetails').delivery_phone === ''
            ? '123123231312'
            : SyncStorage.get('orderDetails').delivery_phone
    }
    orderDetail.delivery_suburb =
      SyncStorage.get('orderDetails').delivery_state === undefined
        ? '0'
        : SyncStorage.get('orderDetails').delivery_state
    orderDetail.customers_suburb =
      SyncStorage.get('orderDetails').delivery_state === undefined
        ? '0'
        : SyncStorage.get('orderDetails').delivery_state
    orderDetail.customers_address_format_id = '1'
    orderDetail.delivery_address_format_id = '1'
    orderDetail.products = this.state.products
    /// //////////////////////
    // orderDetail.products.map(val => {
    //   if (val.product !== undefined && val.product !== null) {
    //     val.product = undefined
    //   }
    // })
    orderDetail.is_coupon_applied = this.state.couponApplied
    orderDetail.coupons = this.state.couponArray
    orderDetail.coupon_amount = this.state.discount
    orderDetail.totalPrice = this.state.totalAmountWithDisocunt
    orderDetail.nonce = this.state.token
    orderDetail.language_id =
      SyncStorage.get('langId') === undefined ? 1 : SyncStorage.get('langId')
    orderDetail.currency_code = this.props.cartItems2.Config.productsArguments.currency
    if (orderDetail.delivery_state === undefined) { orderDetail.delivery_state = 'other' }
    var dat = orderDetail
    const data = await WooComFetch.postHttp(
      getUrl() + '/api/' + 'addtoorder',
      dat
    )
    console.log("dataresponse===>",data)
    if (data.success == 1) {
      this.props.cartItems2.cartItems.cartProductArray = []
      this.props.cartItems2.cartItems.couponArray = []
      this.props.cartItems2.cartItems.cartquantity = 0
      SyncStorage.set('cartProducts', [])
      SyncStorage.set('thanksActive', true)
      const resetAction = StackActions.reset({
        key: null,
        index: 1,
        actions: [
          NavigationActions.navigate({ routeName: 'CartScreen' }),
          NavigationActions.navigate({ routeName: 'ThankUScreen' })
        ]
      })
      this.props.navigation.dispatch(resetAction)
      this.setState({ SpinnerTemp: false }, () =>
        this.props.navigation.navigate('ThankUScreen')
      )

      this.setState({ SpinnerTemp: false }, () =>
        this.props.navigation.dispatch(resetAction)
      )
      this.setState({ SpinnerTemp: false })
    }

    if (data.success == 0) {
      this.setState({ SpinnerTemp: false }, () => {
        this.props.productDeleteIdFun(data.data.products_id,
          data.data.message, true)
        const resetAction = StackActions.reset({
          key: null,
          index: 1,
          actions: [
            NavigationActions.navigate({ routeName: 'CartScreen' }),
            NavigationActions.navigate({ routeName: 'ThankUScreen' })
          ]
        })
        this.props.navigation.dispatch(resetAction)
        this.setState({ SpinnerTemp: false }, () =>
          this.props.navigation.navigate('CartScreen')
        )
      })
    }
    this.setState({ SpinnerTemp: false })
  }


  /// ////////////////////////////////////
  onInit = async () => {
    const json2 = await WooComFetch.getPaymentGateways(
      this.props.cartItems2.Config.productsArguments
    )
    json2.map((buttonInfo, index) => {
      this.state.radioButton[index] = false
    })
    this.setState({
      loaderPaymentMethods: false,
      paymentMethods: json2,
      paymentShowCondition: false
      
    })
  }

  getProducts () {
    const data = []
    for (const v of this.props.cartItems2.cartItems.cartProductArray) {
      const obj = {
        quantity: v.quantity,
        product_id: v.product_id,
        total: v.total.toString(),
        price: v.price.toString()
      }
      if (v.variation_id) Object.assign(obj, { variation_id: v.variation_id })
      data.push(obj)
    }
    return data
  }

  singaleRow (placeholderText, name, iconValue, paymentIcon, index, id) {
    return (
      <View
        style={{
          justifyContent: 'space-between',
          padding: 6,
          flexDirection: 'row',
          flex: 1
        }}>
        <Text
          style={{
            textAlign: 'center',
            fontSize: themeStyle.mediumSize,
            color: themeStyle.textColor,
            paddingTop: 3
          }}>
          {placeholderText}
        </Text>
        {paymentIcon ? (
          <Icon
            onPress={() => {
              this.state.paymentMethods.map((buttonInfo, index) => {
                this.state.radioButton[index] = false
              })
              this.state.radioButton[index]
                ? (this.state.radioButton[index] = false)
                : (this.state.radioButton[index] = true)
              this.setState({
                radioButton: this.state.radioButton,
                wrapperCondition2: false,
                paymentText: placeholderText,
                selectedPaymentMethod: id,
                buttonEnable: true,
                selectedPaymentMethodTitle: placeholderText
              })
            }}
            name={
              !this.state.radioButton[index]
                ? 'radio-button-off'
                : 'radio-button-on'
            }
            style={{ color: '#4d4d4d', fontSize: 25 }}
          />
        ) : iconValue ? (
          <TouchableOpacity
            onPress={() => this.setState({ wrapperCondition2: true })}>
            <View
              style={{
                justifyContent: 'space-around',
                padding: 3,
                flexDirection: 'row'
              }}>
              <Text
                style={{
                  paddingRight: 5,
                  fontSize: themeStyle.mediumSize,
                  paddingTop: 2,
                  color: themeStyle.textColor
                }}>
                {this.state.paymentText}
              </Text>
              <Icon
                name={'arrow-dropdown'}
                style={{ color: '#4d4d4d', fontSize: 22 }}
              />
            </View>
          </TouchableOpacity>
        ) : (
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              justifyContent: 'flex-end'
            }}>
            <HTML
              html={SyncStorage.get('currency')}
              baseFontStyle={{ fontSize: themeStyle.mediumSize, color: themeStyle.textColor }}
            />
            <Text
              style={{
                textAlign: 'center',
                fontSize: themeStyle.mediumSize,
                color: themeStyle.textColor
              }}>
              {name}
            </Text>
          </View>
        )}
      </View>
    )
  }

  /// //////////////////////////////////////////
  singaleRow3 (placeholderText, name, iconValue, paymentIcon, index, id) {
    return (
      <TouchableOpacity
        style={{
          justifyContent: 'space-between',
          padding: 6,
          flexDirection: 'row',
          flex: 1
        }}
        onPress={() => {
          const temp = SyncStorage.get('orderDetails')
          temp.payment_method = this.state.method[index]
          SyncStorage.set('orderDetails', temp)
          this.state.paymentMethods.map((buttonInfo, index) => {
            this.state.radioButton[index] = false
          })
          this.state.radioButton[index]
            ? (this.state.radioButton[index] = false)
            : (this.state.radioButton[index] = true)

          this.setState({
            radioButton: this.state.radioButton,
            wrapperCondition2: false,
            paymentText: placeholderText,
            selectedPaymentMethod: id,
            buttonEnable: true,

            selectedPaymentMethodTitle: placeholderText
          })
        }}>
        <View
          style={{
            justifyContent: 'space-around',
            padding: 3,
            flexDirection: 'row'
          }}>
          <Text
            style={{
              textAlign: 'center',
              fontSize: themeStyle.mediumSize,
              color: themeStyle.textColor,
              paddingTop: 3
            }}>
            {placeholderText}
          </Text>
        </View>
        <Icon
          onPress={() => {
            const temp = SyncStorage.get('orderDetails')
            temp.payment_method = this.state.method[index]
            SyncStorage.set('orderDetails', temp)
            this.state.paymentMethods.map((buttonInfo, index) => {
              this.state.radioButton[index] = false
            })
            this.state.radioButton[index]
              ? (this.state.radioButton[index] = false)
              : (this.state.radioButton[index] = true)
            this.setState({
              radioButton: this.state.radioButton,
              wrapperCondition2: false,
              paymentText: placeholderText,
              selectedPaymentMethod: id,
              buttonEnable: true,
              selectedPaymentMethodTitle: placeholderText
            })
          }}
          name={
            !this.state.radioButton[index]
              ? 'radio-button-off'
              : 'radio-button-on'
          }
          style={{ color: '#4d4d4d', fontSize: 25 }}
        />
      </TouchableOpacity>
    )
  }

  wraperTouchButton (text, code) {
    return (
      <TouchableOpacity
        style={{ paddingTop: 0 }}
        onPress={() =>
          this.setState({ wrapperCondition: false, couponText: code })
        }>
        <View
          style={{
            alignItems: 'flex-start',
            flexDirection: 'row',
            backgroundColor: 'transparent'
          }}>
          <Icon
            name={'arrow-forward'}
            style={{ color: '#4d4d4d', paddingTop: 12, fontSize: 18 }}
          />
          <Text
            style={{
              fontSize: themeStyle.mediumSize,
              color: themeStyle.textColor,
              paddingLeft: 10,
              paddingTop: 7
            }}>
            {text}
          </Text>
        </View>
      </TouchableOpacity>
    )
  }

  getCoupon = async code => {
    this.setState({ SpinnerTemp: true })
    var dat = { code: code }
    const data = await postHttp(getUrl() + '/api/' + 'getcoupon', dat)
    if (data.success == 1) {
      const coupon = data.data[0]
      this.applyCouponCart(coupon)
    }
    if (data.success == 0) {
      this.refs.toast.show(data.message)
    }
    // this.refs.toast.show(data.message)
    this.setState({ SpinnerTemp: false, couponText: '' })
  }

  deleteCoupon = code => {
    this.state.couponArray.forEach((value, index) => {
      if (value.code == code) {
        this.state.couponArray.splice(index, 1)
        return true
      }
    })

    this.state.products = JSON.parse(
      JSON.stringify(SyncStorage.get('cartProducts'))
    )
    this.state.orderDetail.shipping_cost = SyncStorage.get(
      'orderDetails'
    ).shipping_cost

    this.state.couponArray.forEach(value => {
      if (value.free_shipping == true) {
        SyncStorage.get('orderDetails').shippingName = 'free shipping'
        SyncStorage.get('orderDetails').shippingCost = 0
      }
      this.state.products = couponProvider.apply(value, this.state.products)
    })
    this.calculateTotal()
    if (this.state.couponArray.length === 0) {
      this.state.couponApplied = 0
    }
    this.setState({})
  }

  applyCouponCart = coupon => {
    if (
      couponProvider.validateCouponService(
        this.refs.toast,
        coupon,
        this.state.products,
        this.state.couponArray
      ) == false
    ) {
      return 0
    } else {
      if (coupon.individual_use == 1) {
        this.state.products = JSON.parse(
          JSON.stringify(SyncStorage.get('cartProducts'))
        )
        this.state.couponArray = []
        this.state.orderDetail.shipping_cost = SyncStorage.get(
          'orderDetails'
        ).shipping_cost
      }
      var v = {}
      v.code = coupon.code
      v.amount = coupon.amount
      v.product_ids = coupon.product_ids
      v.exclude_product_ids = coupon.exclude_product_ids
      v.product_categories = coupon.product_categories
      v.excluded_product_categories = coupon.excluded_product_categories
      v.discount = coupon.amount
      v.individual_use = coupon.individual_use
      v.free_shipping = coupon.free_shipping
      v.discount_type = coupon.discount_type
      this.state.couponArray.push(v)
    }

    if (coupon.free_shipping == 1) {
      this.state.orderDetail.shipping_cost = 0
    }
    // applying coupon service
    this.state.products = couponProvider.apply(coupon, this.state.products)
    if (this.state.couponArray.length != 0) {
      this.state.couponApplied = 1
    }
    this.calculateTotal()
  }


  //iPay88 integraration
  test = async ()=>{
    const obj =this.state.products;

    let newObjArray = obj.map((item)=>{

      return{
        ...item,
      "attributes":item.attributes,
      "cart_id":item.cart_id,
      "customers_basket_quantity":item.customers_basket_quantity,
      "final_price":item.final_price,
      "image":item.image,
      "model":item.model,
      "on_sale":item.on_sale,
      "price":item.price,
      "products_id":item.products_id,
      "products_name":item.products_name,
      "subtotal":item.subtotal,
      "total":item.total,
      "unit":item.unit,
      "weight":item.weight
    }
    })
    console.log("newproducts=====>" ,newObjArray)
    const dataorder = [{"attributes":
    obj[0].attributes,
    "cart_id":obj[0].cart_id,
    "customers_basket_quantity":obj[0].customers_basket_quantity,
    "final_price":obj[0].final_price,
    "image":obj[0].image,
    "model":obj[0].model,
    "on_sale":obj[0].on_sale,
    "price":obj[0].price,
    "products_id":obj[0].products_id,
    "products_name":obj[0].products_name,
    "subtotal":obj[0].subtotal,
    "total":obj[0].total,
    "unit":obj[0].unit,
    "weight":obj[0].weight
  }]
    console.log("products_id===>",dataorder)
    let formData = new FormData()
    
    const orderDetail = SyncStorage.get('orderDetails')
    orderDetail.customers_id =
      SyncStorage.get('customerData').customers_id === undefined
        ? 1
        : SyncStorage.get('customerData').customers_id

        formData.append('customers_id',SyncStorage.get('customerData').customers_id === undefined
        ? 1
        : SyncStorage.get('customerData').customers_id)
        formData.append('email',SyncStorage.get('customerData').email === undefined ||
        SyncStorage.get('customerData').email === ''
          ? 'guest@gmail.com'
          : SyncStorage.get('customerData').email)
        formData.append('guest_status',"0")
        formData.append('delivery_firstname',SyncStorage.get('orderDetails').delivery_firstname)
        formData.append('delivery_lastname',SyncStorage.get('orderDetails').delivery_lastname)
        formData.append('customers_telephone',SyncStorage.get('customerData').customers_telephone === undefined ||
        SyncStorage.get('orderDetails').delivery_phone === ''
        ? '123123231312'
        : SyncStorage.get('customerData').customers_telephone.toString())
        formData.append('delivery_street_address',this.state.orderDetail.delivery_street_address)
        formData.append('delivery_suburb',this.state.orderDetail.delivery_state)
        formData.append('delivery_city',this.state.orderDetail.delivery_city)
        formData.append('delivery_postcode',this.state.orderDetail.delivery_postcode.toString())
        formData.append('delivery_country',this.state.orderDetail.delivery_country.toString())
        formData.append('delivery_zone',this.state.orderDetail.delivery_city.toString())
        formData.append('billing_firstname',SyncStorage.get('orderDetails').billing_firstname.toString())
        formData.append('billing_lastname', SyncStorage.get('orderDetails').billing_lastname.toString())
        formData.append('billing_street_address',this.state.orderDetail.billing_street_address.toString())
        formData.append('billing_city',this.state.orderDetail.billing_city.toString())
        formData.append('billing_suburb',this.state.orderDetail.billing_state.toString())
        formData.append('billing_postcode',this.state.orderDetail.billing_postcode.toString())
        formData.append('billing_country',this.state.orderDetail.billing_country.toString())
        formData.append('billing_zone',this.state.orderDetail.billing_city.toString())
        formData.append('payment_method','ipay')
        formData.append('products',JSON.stringify(dataorder))
        formData.append('totalPrice',"1.00")
        formData.append('currency_code',this.props.cartItems2.Config.productsArguments.currency.toString())
        formData.append('currency_value','2.00')
        formData.append('total_tax',this.state.orderDetail.total_tax.toString())
        formData.append('delivery_phone',SyncStorage.get('orderDetails').delivery_phone === undefined ||
        SyncStorage.get('orderDetails').delivery_phone === ''
        ? '123123231312'
        : SyncStorage.get('orderDetails').delivery_phone)
        formData.append('billing_phone', SyncStorage.get('customerData').customers_telephone === undefined ||
        SyncStorage.get('orderDetails').delivery_phone === ''
        ? '123123231312'
        : SyncStorage.get('customerData').customers_telephone)
        formData.append('is_coupon_applied',this.state.couponApplied)
        formData.append('coupon_amount',this.state.discount)
        formData.append('coupons',this.state.couponArray)
        formData.append('nonce',this.state.token)
        formData.append('transaction_id','1234')
        formData.append('language_id',SyncStorage.get('langId') === undefined ? 1 : SyncStorage.get('langId'))
        formData.append('shipping_cost',this.state.orderDetail.shipping_cost)
        formData.append('shipping_method',this.state.orderDetail.shipping_method)
        formData.append('comments','Test')
        

    orderDetail.customers_name =
      SyncStorage.get('orderDetails').delivery_firstname +
      ' ' +
      SyncStorage.get('orderDetails').delivery_lastname
    orderDetail.delivery_name =
      SyncStorage.get('orderDetails').billing_firstname +
      ' ' +
      SyncStorage.get('orderDetails').billing_lastname
    if (SyncStorage.get('orderDetails').guest_status == 1) {
      orderDetail.email =
        SyncStorage.get('customerData').email === undefined ||
        SyncStorage.get('customerData').email === ''
          ? 'guest@gmail.com'
          : SyncStorage.get('customerData').email
      orderDetail.customers_telephone =
        SyncStorage.get('orderDetails').delivery_phone === undefined ||
          SyncStorage.get('orderDetails').delivery_phone === ''
          ? '123123231312'
          : SyncStorage.get('orderDetails').delivery_phone
      orderDetail.delivery_phone =
          SyncStorage.get('orderDetails').delivery_phone === undefined ||
          SyncStorage.get('orderDetails').delivery_phone === ''
            ? '123123231312'
            : SyncStorage.get('orderDetails').delivery_phone
    } else {
      orderDetail.email =
        SyncStorage.get('customerData').email === undefined ||
        SyncStorage.get('customerData').email === ''
          ? 'guest@gmail.com'
          : SyncStorage.get('customerData').email
      orderDetail.customers_telephone =
        SyncStorage.get('customerData').customers_telephone === undefined ||
          SyncStorage.get('orderDetails').delivery_phone === ''
          ? '123123231312'
          : SyncStorage.get('customerData').customers_telephone
      orderDetail.delivery_phone =
          SyncStorage.get('orderDetails').delivery_phone === undefined ||
          SyncStorage.get('orderDetails').delivery_phone === ''
            ? '123123231312'
            : SyncStorage.get('orderDetails').delivery_phone
    }
    orderDetail.delivery_suburb =
      SyncStorage.get('orderDetails').delivery_state === undefined
        ? '0'
        : SyncStorage.get('orderDetails').delivery_state
    orderDetail.customers_suburb =
      SyncStorage.get('orderDetails').delivery_state === undefined
        ? '0'
        : SyncStorage.get('orderDetails').delivery_state
    orderDetail.customers_address_format_id = '1'
    orderDetail.delivery_address_format_id = '1'
    orderDetail.products = [{"attributes": [], "cart_id": 310, "customers_basket_quantity": 1, "final_price": "5.9", "image": "images/media/2021/11/uojmV15307.jpg", "model": null, "on_sale": false, "price": "5.9", "products_id": 31, "products_name": "Long Black", "subtotal": "5.9", "total": "5.9", "unit": "gm", "weight": "0"}, {"attributes": [], "cart_id": 311, "customers_basket_quantity": 1, "final_price": "5.9", "image": "images/media/2021/11/uojmV15307.jpg", "model": null, "on_sale": false, "price": "5.9", "products_id": 31, "products_name": "Long Black", "subtotal": "5.9", "total": "5.9", "unit": "gm", "weight": "0"}, {"attributes": [], "cart_id": 212, "customers_basket_quantity": 1, "final_price": 1, "image": "images/media/2021/11/CO7gw15404.jpg", "model": null, "on_sale": false, "price": 1, "products_id": 21, "products_name": "Espresso Nutritional", "subtotal": 1, "total": 1, "unit": "gm", "weight": "0"}]
    /// //////////////////////
    // orderDetail.products.map(val => {
    //   if (val.product !== undefined && val.product !== null) {
    //     val.product = undefined
    //   }
    // })
    orderDetail.is_coupon_applied = this.state.couponApplied
    orderDetail.coupons = this.state.couponArray
    orderDetail.coupon_amount = this.state.discount
    orderDetail.totalPrice = this.state.totalAmountWithDisocunt
    orderDetail.nonce = this.state.token
    // orderDetail.transaction_id = transactionId
    orderDetail.language_id =
      SyncStorage.get('langId') === undefined ? 1 : SyncStorage.get('langId')
    orderDetail.currency_code = this.props.cartItems2.Config.productsArguments.currency
    if (orderDetail.delivery_state === undefined) { orderDetail.delivery_state = 'other' }
    var dat = orderDetail
      console.log("jbjbhjbhjbijiii",JSON.stringify([{"attributes":obj[0].attributes,"cart_id":obj[0].cart_id,"customers_basket_quantity":obj[0].customers_basket_quantity,"final_price":obj[0].final_price,"image":obj[0].image,"model":obj[0].model,"on_sale":obj[0].on_sale,"price":obj[0].price,"products_id":obj[0].products_id,"products_name":obj[0].products_name,"subtotal":obj[0].subtotal,"total":obj[0].total,"unit":obj[0].unit,"weight":obj[0].weight}]))
    const formData2 = new FormData()
    formData2.append('customers_id', 1)
    formData2.append('products',JSON.stringify(newObjArray))
    formData2.append('guest_status',"0")
    formData2.append('email',SyncStorage.get('customerData').email === undefined ||
        SyncStorage.get('customerData').email === ''
          ? 'guest@gmail.com'
          : SyncStorage.get('customerData').email)
    formData2.append('delivery_firstname',SyncStorage.get('orderDetails').delivery_firstname)
    formData2.append('delivery_lastname',SyncStorage.get('orderDetails').delivery_lastname)
    formData2.append('customers_telephone',SyncStorage.get('customerData').customers_telephone === undefined ||
    SyncStorage.get('orderDetails').delivery_phone === ''
    ? '123123231312'
    : SyncStorage.get('customerData').customers_telephone.toString())
    formData2.append('delivery_street_address',this.state.orderDetail.delivery_street_address)
    formData2.append('delivery_suburb',this.state.orderDetail.delivery_state)
    formData2.append('delivery_city',this.state.orderDetail.delivery_city)
    formData2.append('delivery_postcode',this.state.orderDetail.delivery_postcode.toString())
    formData2.append('delivery_country',this.state.orderDetail.delivery_country.toString())
    formData2.append('delivery_zone',this.state.orderDetail.delivery_city.toString())
    
    formData2.append('payment_method','ipay')
   // formData2.append('products',JSON.stringify([{"attributes":[],"cart_id":210,"customers_basket_quantity":3,"final_price":1,"image":"images/media/2021/11/CO7gw15404.jpg","model":null,"on_sale":false,"price":1,"products_id":21,"products_name":"Espresso Nutritional","subtotal":3,"total":3,"unit":"gm","weight":"0"}]))
    formData2.append('totalPrice',"1.00")
    formData2.append('currency_code',this.props.cartItems2.Config.productsArguments.currency.toString())
    formData2.append('currency_value','2.00')
    formData2.append('total_tax',this.state.orderDetail.total_tax.toString())
    formData2.append('delivery_phone',SyncStorage.get('orderDetails').delivery_phone === undefined ||
        SyncStorage.get('orderDetails').delivery_phone === ''
        ? '123123231312'
        : SyncStorage.get('orderDetails').delivery_phone)
    formData2.append('billing_phone', SyncStorage.get('customerData').customers_telephone === undefined ||
        SyncStorage.get('orderDetails').delivery_phone === ''
        ? '123123231312'
        : SyncStorage.get('customerData').customers_telephone)
    formData2.append('is_coupon_applied',this.state.couponApplied)
    formData2.append('coupon_amount',this.state.discount)
    formData2.append('coupons',JSON.stringify(this.state.couponArray))
    formData2.append('nonce',this.state.token)
    formData2.append('transaction_id','1234')
    formData2.append('language_id',SyncStorage.get('langId') === undefined ? 1 : SyncStorage.get('langId'))
    formData2.append('shipping_cost',this.state.orderDetail.shipping_cost)
    formData2.append('shipping_method',this.state.orderDetail.shipping_method)
    formData2.append('comments','Test')

    const response = await postOrder.orderReq(
      'https://www.bb2go.com/public/api/addtoorder',
      formData2
    )
    console.log('response===>',response)
    console.log("data===>",formData2)
    console.log("log===>",JSON.parse(JSON.stringify(formData)))
  }

   successNotify = async (data) => {
    const {
      transactionId,
      referenceNo,
      amount,
      remark,
      authorizationCode
    } = data;
    const obj =this.state.products;
    let newObjArray = obj.map((item)=>{

      return{
        ...item,
      "attributes":item.attributes,
      "cart_id":item.cart_id,
      "customers_basket_quantity":item.customers_basket_quantity,
      "final_price":item.final_price,
      "image":item.image,
      "model":item.model,
      "on_sale":item.on_sale,
      "price":item.price,
      "products_id":item.products_id,
      "products_name":item.products_name,
      "subtotal":item.subtotal,
      "total":item.total,
      "unit":item.unit,
      "weight":item.weight
    }
    })
   
    const formData2 = new FormData()
    formData2.append('customers_id',SyncStorage.get('customerData').customers_id === undefined
    ? 1
    : SyncStorage.get('customerData').customers_id)
    formData2.append('products',JSON.stringify(newObjArray))
    formData2.append('guest_status',"0")
    formData2.append('email',SyncStorage.get('customerData').email === undefined ||
        SyncStorage.get('customerData').email === ''
          ? 'guest@gmail.com'
          : SyncStorage.get('customerData').email)
    formData2.append('delivery_firstname',SyncStorage.get('orderDetails').delivery_firstname)
    formData2.append('delivery_lastname',SyncStorage.get('orderDetails').delivery_lastname)
    formData2.append('customers_telephone',SyncStorage.get('customerData').customers_telephone === undefined ||
    SyncStorage.get('orderDetails').delivery_phone === ''
    ? '123123231312'
    : SyncStorage.get('customerData').customers_telephone.toString())
    formData2.append('delivery_street_address',this.state.orderDetail.delivery_street_address)
    formData2.append('delivery_suburb',this.state.orderDetail.delivery_state)
    formData2.append('delivery_city',this.state.orderDetail.delivery_city)
    formData2.append('delivery_postcode',this.state.orderDetail.delivery_postcode.toString())
    formData2.append('delivery_country',this.state.orderDetail.delivery_country.toString())
    formData2.append('delivery_zone',this.state.orderDetail.delivery_city.toString())
    
    formData2.append('payment_method','ipay')
   // formData2.append('products',JSON.stringify([{"attributes":[],"cart_id":210,"customers_basket_quantity":3,"final_price":1,"image":"images/media/2021/11/CO7gw15404.jpg","model":null,"on_sale":false,"price":1,"products_id":21,"products_name":"Espresso Nutritional","subtotal":3,"total":3,"unit":"gm","weight":"0"}]))
    formData2.append('totalPrice',amount)
    formData2.append('currency_code',this.props.cartItems2.Config.productsArguments.currency.toString())
    formData2.append('currency_value',)
    formData2.append('total_tax',this.state.orderDetail.total_tax.toString())
    formData2.append('delivery_phone',SyncStorage.get('orderDetails').delivery_phone === undefined ||
        SyncStorage.get('orderDetails').delivery_phone === ''
        ? '123123231312'
        : SyncStorage.get('orderDetails').delivery_phone)
    formData2.append('billing_phone', SyncStorage.get('customerData').customers_telephone === undefined ||
        SyncStorage.get('orderDetails').delivery_phone === ''
        ? '123123231312'
        : SyncStorage.get('customerData').customers_telephone)
    formData2.append('is_coupon_applied',this.state.couponApplied)
    formData2.append('coupon_amount',this.state.discount)
    formData2.append('coupons',JSON.stringify(this.state.couponArray))
    formData2.append('nonce',this.state.token)
    formData2.append('transaction_id',transactionId)
    formData2.append('language_id',SyncStorage.get('langId') === undefined ? 1 : SyncStorage.get('langId'))
    formData2.append('shipping_cost',this.state.orderDetail.shipping_cost)
    formData2.append('shipping_method',this.state.orderDetail.shipping_method)
    formData2.append('comments',this.state.customerNotes)

    const response = await postOrder.orderReq(
      'https://www.bb2go.com/public/api/addtoorder',
      formData2
    )
    console.log('response===>',response)
    console.log("data===>",formData2)
    console.log("log===>",JSON.parse(JSON.stringify(formData)))
  

    console.log('response===>',response)
    if (response.success == 1) {
      this.props.cartItems2.cartItems.cartProductArray = []
      this.props.cartItems2.cartItems.couponArray = []
      this.props.cartItems2.cartItems.cartquantity = 0
      SyncStorage.set('cartProducts', [])
      SyncStorage.set('thanksActive', true)
      const resetAction = StackActions.reset({
        key: null,
        index: 1,
        actions: [
          NavigationActions.navigate({ routeName: 'CartScreen' }),
          NavigationActions.navigate({ routeName: 'ThankUScreen' })
        ]
      })
      this.props.navigation.dispatch(resetAction)
      this.setState({ SpinnerTemp: false }, () =>
        this.props.navigation.navigate('ThankUScreen')
      )

      this.setState({ SpinnerTemp: false }, () =>
        this.props.navigation.dispatch(resetAction)
      )
      this.setState({ SpinnerTemp: false })
    }

    if (response.success == 0) {
      this.setState({ SpinnerTemp: false }, () => {
        this.props.productDeleteIdFun(data.data.products_id,
          data.data.message, true)
        const resetAction = StackActions.reset({
          key: null,
          index: 1,
          actions: [
            NavigationActions.navigate({ routeName: 'CartScreen' }),
            NavigationActions.navigate({ routeName: 'ThankUScreen' })
          ]
        })
        this.props.navigation.dispatch(resetAction)
        this.setState({ SpinnerTemp: false }, () =>
          this.props.navigation.navigate('CartScreen')
        )
      })
    }
    this.setState({ SpinnerTemp: false })
   
   
   
   
   
   
    // if (data) {
    //   const getReq = await WooComFetch.getAllBanners("ipaypaymentstatus");
    //   console.log("PaymentDetails==>",getReq)
    //   this.props.cartItems2.cartItems.cartProductArray = []
    //   this.props.cartItems2.cartItems.couponArray = []
    //   this.props.cartItems2.cartItems.cartquantity = 0
    //   SyncStorage.set('cartProducts', [])
    //   SyncStorage.set('thanksActive', true)
    //   const resetAction = StackActions.reset({
    //     key: null,
    //     index: 1,
    //     actions: [
    //       NavigationActions.navigate({ routeName: 'CartScreen' }),
    //       NavigationActions.navigate({ routeName: 'ThankUScreen' })
    //     ]
    //   })
    //   this.props.navigation.dispatch(resetAction)
    //   this.setState({ SpinnerTemp: false }, () =>
    //     this.props.navigation.navigate('ThankUScreen')
    //   )

    //   this.setState({ SpinnerTemp: false }, () =>
    //     this.props.navigation.dispatch(resetAction)
    //   )
    //   this.setState({ SpinnerTemp: false })
    // }

   console.log("SuccessData",data)
  };

  cancelNotify = data => {
    
    alert("Payment Canceled");

    console.log("CancelData",data)
  };

  failedNotify = data => {
    
    alert("Transaction Failed")
    console.log("Faileddata",data)
  };


  pay = (id,name,email,mobile,amount) => {
    
    try {
      const money = amount.toString().trim();
      const data = {};
      //  data.merchantKey = "VUTBcqLLUy";
      // data.merchantCode = "M33684_S0001";
      data.merchantKey = "odMr5c0yIL";
      data.merchantCode = "M03238";
      data.paymentId = " "; // refer to ipay88 docs    
      data.referenceNo = Number(Math.floor(Math.random() * id + 1000 * Math.random() * 10)).toString() ;
      data.amount = "1.00";
      data.currency = "MYR";
      data.productDescription = "Payment";
      data.userName = name ;
      data.userEmail = email;
      data.userContact = mobile;
      data.remark = "me";
      data.utfLang = "UTF-8";
      data.country = "MY";
      data.backendUrl = "http://bb2go.com/ipay-callback-backend";
      const errs = Pay(data);
      if (errs != [] || errs != 'undefined') {
        console.log("PayOrderdataLog",errs);
      }
    } catch (e) {
      console.log(e);
    }
  };


  
  cod =(data)=>{
    console.log("clearedddddcart")
    if (data) {

      this.props.cartItems2.cartItems.cartProductArray = []
      this.props.cartItems2.cartItems.couponArray = []
      this.props.cartItems2.cartItems.cartquantity = 0
      SyncStorage.set('cartProducts', [])
      SyncStorage.set('thanksActive', true)
      const resetAction = StackActions.reset({
        key: null,
        index: 1,
        actions: [
          NavigationActions.navigate({ routeName: 'CartScreen' }),
          NavigationActions.navigate({ routeName: 'ThankUScreen' })
        ]
      })
      this.props.navigation.dispatch(resetAction)
      this.setState({ SpinnerTemp: false }, () =>
        this.props.navigation.navigate('ThankUScreen')
      )

      
      this.setState({ SpinnerTemp: false })
    }



  }
  componentDidMount () {
    this.addOrder()
    // this.test();
    console.log('productslist====>',this.getProducts())
    console.log('products',this.state.products)
    this.calculateTotal()
    this.initializePaymentMethods();
    this.onInit();
    this.props.navigation.setParams({
      headerTitle: this.props.cartItems2.Config.languageJson2.Order
    })

    console.log(SyncStorage.get('customerData'))

    console.log("orderDetails===>", SyncStorage.get('orderDetails'))
    console.log("amount",this.state.totalAmountWithDisocunt.toFixed(2).toString().trim() === "2.00")
    setTimeout(()=>console.log("paymentMethod," ,this.state.paymentMethods),2000)

    console.log('jsonStringify',JSON.stringify(SyncStorage.get('cartProducts')))
    console.log('jsonParse',JSON.parse(JSON.stringify(SyncStorage.get('cartProducts'))))
    //this.test();
  }

  render () {
    return (
      <View style={{ flex: 1, backgroundColor: themeStyle.backgroundColor }}>
        <Spinner
          visible={this.state.SpinnerTemp}
          textStyle={{
            color: themeStyle.loadingIndicatorColor,
            backgroundColor: themeStyle.loadingIndicatorColor
          }}
        />
        <Toast
          ref='toast'
          style={{ backgroundColor: '#c1c1c1' }}
          position='bottom'
          positionValue={200}
          fadeOutDuration={7000}
          textStyle={{ color: themeStyle.textColor, fontSize: 15 }}
        />
        <ModalWrapper
          style={{
            width: 290,
            height: 310,
            paddingLeft: 24,
            paddingRight: 24,
            backgroundColor: themeStyle.backgroundColor
          }}
          visible={this.state.wrapperCondition}>
          <Text
            style={{
              fontSize: themeStyle.largeSize,
              padding: 5,
              fontWeight: '600',
              color: themeStyle.textColor
            }}>
            Demo Coupons{' '}
          </Text>
          <View>
            <View
              style={{
                paddingLeft: 1,
                flexDirection: 'column',
                paddingRight: 2
              }}>
              {this.wraperTouchButton(
                'Cart Percentage (cp9989). A percentage discount for selected products only',
                'cp9989'
              )}
              {this.wraperTouchButton(
                'Product Fixed (pf8787). A fixed total discount for selected products only',
                'pf8787'
              )}
              {this.wraperTouchButton(
                'Cart Fixed (cf9999). A fixed total discount for the entire cart',
                'cf9999'
              )}
              {this.wraperTouchButton(
                'Product Percentage (pp2233). A percentage discount for selected products only',
                'pp2233'
              )}
            </View>
          </View>
          <TouchableOpacity
            style={{ paddingTop: 5 }}
            onPress={() => this.setState({ wrapperCondition: false })}>
            <View
              style={{
                alignItems: 'flex-start',
                margin: 20,
                backgroundColor: 'transparent',
                justifyContent: 'center',
                paddingLeft: 12,
                marginLeft: 10,
                paddingBottom: 5,
                marginBottom: 0
              }}>
              <Text
                style={{
                  textAlign: 'center',
                  fontSize: themeStyle.mediumSize,
                  color: themeStyle.textColor,
                  fontWeight: '600'
                }}>
                {this.props.cartItems2.Config.languageJson2.Close}
              </Text>
            </View>
          </TouchableOpacity>
        </ModalWrapper>
        <ModalWrapper
          style={{
            width: 280,
            paddingLeft: 24,
            paddingRight: 24,
            backgroundColor: themeStyle.backgroundColor
          }}
          visible={this.state.wrapperCondition2}>
          <Text
            style={{
              padding: 10,
              fontSize: themeStyle.largeSize,
              fontWeight: '500',
              paddingTop: 20,
              color: themeStyle.textColor
            }}>
            {this.props.cartItems2.Config.languageJson2.Payment}
          </Text>

          <View
            style={{
              width: '100%',
              height: 3,
              backgroundColor: '#d9d9d9',
              marginBottom: 12
            }}
          />

          <View>
            <View
              style={{
                paddingLeft: 1,
                flexDirection: 'column',
                justifyContent:"center",
                paddingRight: 2
              }}>
              <FlatList
                data={this.state.paymentMethods}
                horizontal={false}
                showsVerticalScrollIndicator={false}
                extraData={this.state}
                keyExtractor={(item, index) => index.toString()}
                renderItem={item =>
                  item.item.active == 1
                    ? this.singaleRow3(
                      item.name,
                      this.state.discount,
                      true,
                      true,
                      item.index,
                      item.item.method
                    )
                    : null
                }
              />
 
            </View>
          </View>
 <TouchableOpacity
            style={{ padding: 10 }}
            onPress={()=>this.pay(SyncStorage.get('customerData').customers_id.toString(),
                  SyncStorage.get('customerData').customers_firstname.toString(),
                  SyncStorage.get('customerData').email.toString(),
                  SyncStorage.get('customerData').customers_telephone.toString(),
                  this.state.totalAmountWithDisocunt.toFixed(2)

                  )}>
            <View
              style={{
                alignItems: 'flex-start',
                padding: 3,
                backgroundColor: themeStyle.backgroundColor,
                justifyContent: 'center',
                paddingLeft: 6,
                paddingBottom: 5
              }}>
             <Text style={{fontSize: themeStyle.mediumSize,color:themeStyle.textColor,textAlign:"left"}}>iPay88 Payment</Text>
            </View>
          </TouchableOpacity>   
          <View
            style={{
              width: '100%',
              height: 1,
              backgroundColor: '#d9d9d9'
            }}
          />   
                    {/* <TouchableOpacity
            style={{ padding: 10 }}
            onPress={() => this.cod(true)}>
            <View
              style={{
                alignItems: 'flex-start',
                padding: 3,
                backgroundColor: 'transparent',
                justifyContent: 'center',
                paddingLeft: 6,
                paddingBottom: 5
              }}>
                <Text style={{fontSize: themeStyle.mediumSize,color:themeStyle.textColor}}>Cash On Delivery</Text>
            </View>
          </TouchableOpacity> */}
          <View
            style={{
              width: '100%',
              height: 1,
              backgroundColor: '#d9d9d9'
            }}
          />
          <TouchableOpacity
            style={{ padding: 10 }}
            onPress={() => this.setState({ wrapperCondition2: false })}>
            <View
              style={{
                alignItems: 'flex-start',
                padding: 10,
                backgroundColor: 'transparent',
                justifyContent: 'center',
                paddingLeft: 12,
                paddingBottom: 5
              }}>
              <Text
                style={{
                  textAlign: 'center',
                  fontSize: themeStyle.mediumSize,
                  color: themeStyle.textColor
                }}>
                {this.props.cartItems2.Config.languageJson2.Close}
              </Text>
            </View>
          </TouchableOpacity>
        </ModalWrapper>
        <FlatList
          data={['asd']}
          horizontal={false}
          showsVerticalScrollIndicator={false}
          extraData={this.state}
          ListFooterComponent={
            <View style={{ backgroundColor: themeStyle.backgroundColor }}>
              {this.state.buttonEnable ? (
                <TouchableOpacity
                  style={{
                    margin: 10,
                    marginBottom: 20,
                    marginTop: 5
                  }}
                  onPress={() => {
                    if (
                      SyncStorage.get('orderDetails').payment_method ===
                      'paypal'
                    ) {
                      this.paypayMethod()
                    }
                    if (
                      SyncStorage.get('orderDetails').payment_method ===
                        'stripe' ||
                      SyncStorage.get('orderDetails').payment_method === 'cod'
                    ) {
                      this.setState({ SpinnerTemp: true }, () => this.addOrder())
                    }
                    if (SyncStorage.get('orderDetails').payment_method === 'razorpay') {
                      this.setState({ SpinnerTemp: true }, () => {
                        var options = {
                          description: 'Credits towards consultation',
                          image: 'https://i.imgur.com/3g7nmJC.png',
                          // "currency": "INR",
                          currency: this.props.cartItems2.Config.productsArguments.currency.toString(),
                          key: this.state.razorPayKey,
                          amount: this.state.totalAmountWithDisocunt * 100,
                          name: 'Razor Pay',
                          prefill: {
                            email: SyncStorage.get('customerData').email,
                            contact: SyncStorage.get('customerData').customers_telephone,
                            name: SyncStorage.get('customerData').first_name + ' ' + SyncStorage.get('customerData').last_name
                          },
                          theme: { color: themeStyle.primary }
                        }
                        RazorpayCheckout.open(options).then((data) => {
                          this.setState({ token: data.razorpay_payment_id }, () => this.addOrder())
                        }).catch((error) => {
                          this.setState({ SpinnerTemp: false }, () => {
                            Alert.alert(`Error: ${error.code} | ${error.description}`)
                          }
                          )
                        })
                      })
                    }
                  }}>
                  <View
                    style={{
                      borderColor: '#fff',
                      alignItems: 'center',
                      height: 38,
                      backgroundColor: themeStyle.otherBtnsColor,
                      flex: 1,
                      justifyContent: 'center',
                      elevation: 5,
                      shadowOffset: { width: 1, height: 1 },
                      shadowColor: themeStyle.textColor,
                      shadowOpacity: 0.5
                    }}>
                    <Text
                      style={{
                        color: themeStyle.otherBtnsText,
                        fontSize: themeStyle.mediumSize,
                        fontWeight: '500'
                      }}>
                      {this.props.cartItems2.Config.languageJson2.Continue}
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : null}
            </View>
          }
          numColumns={2}
          keyExtractor={(item, index) => index.toString()}
          renderItem={() => (
            <View
              style={{
                backgroundColor: themeStyle.backgroundColor,
                justifyContent: 'space-between',
                shadowOffset: { width: 1, height: 1 },
                shadowColor: themeStyle.textColor,
                shadowOpacity: 0.5,
                elevation: 5,
                flex: 1
              }}>
              <View
                style={{
                  backgroundColor: themeStyle.backgroundColor,
                  justifyContent: 'space-between',
                  shadowOffset: { width: 1, height: 1 },
                  shadowColor: themeStyle.textColor,
                  shadowOpacity: 0.5,
                  flex: 1,
                  margin: 10,
                  marginTop: 10,
                  marginBottom: 5,
                  elevation: 5
                }}>
                <View
                  style={{
                    justifyContent: 'space-between',

                    flex: 1
                  }}>
                  <Text
                    style={{
                      justifyContent: 'space-between',
                      padding: 10,
                      flex: 1,
                      backgroundColor: '#d3d3d3',
                      fontSize: themeStyle.largeSize,
                      fontWeight: '500',
                      color: themeStyle.textContrast
                    }}>
                    {
                      this.props.cartItems2.Config.languageJson2[
                        'Shipping Address'
                      ]
                    }
                  </Text>

                  <Text
                    style={{
                      justifyContent: 'space-between',
                      padding: 10,
                      flex: 1,
                      fontSize: themeStyle.mediumSize,
                      color: themeStyle.textColor
                    }}>
                    {this.state.orderDetail.delivery_street_address +
                      ', ' +
                      this.state.orderDetail.delivery_city +
                      ', ' +
                      this.state.orderDetail.delivery_state +
                      ',' +
                      this.state.orderDetail.delivery_postcode +
                      ', ' +
                      this.state.orderDetail.delivery_country}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: themeStyle.backgroundColor,
                  justifyContent: 'space-between',
                  shadowOffset: { width: 1, height: 1 },
                  shadowColor: themeStyle.textColor,
                  shadowOpacity: 0.5,
                  flex: 1,
                  margin: 10,
                  marginTop: 10,
                  marginBottom: 5,
                  elevation: 5
                }}>
                <View
                  style={{
                    justifyContent: 'space-between',

                    flex: 1
                  }}>
                  <Text
                    style={{
                      justifyContent: 'space-between',
                      padding: 10,
                      flex: 1,
                      backgroundColor: '#d3d3d3',
                      fontSize: themeStyle.largeSize,
                      fontWeight: '500',
                      color: themeStyle.textContrast
                    }}>
                    {
                      this.props.cartItems2.Config.languageJson2[
                        'Billing Address'
                      ]
                    }
                  </Text>

                  <Text
                    style={{
                      justifyContent: 'space-between',
                      padding: 10,
                      flex: 1,
                      fontSize: themeStyle.mediumSize,
                      color: themeStyle.textColor
                    }}>
                    {this.state.orderDetail.billing_street_address +
                      ', ' +
                      this.state.orderDetail.billing_city +
                      ', ' +
                      this.state.orderDetail.billing_state +
                      ', ' +
                      this.state.orderDetail.billing_postcode +
                      ', ' +
                      this.state.orderDetail.billing_country}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: themeStyle.backgroundColor,
                  justifyContent: 'space-between',
                  shadowOffset: { width: 1, height: 1 },
                  shadowColor: themeStyle.textColor,
                  shadowOpacity: 0.5,
                  flex: 1,
                  margin: 10,
                  marginTop: 10,
                  marginBottom: 5,
                  elevation: 5
                }}>
                <View
                  style={{
                    justifyContent: 'space-between',
                    flex: 1
                  }}>
                  <Text
                    style={{
                      justifyContent: 'space-between',
                      padding: 10,
                      flex: 1,
                      backgroundColor: '#d3d3d3',
                      fontSize: themeStyle.largeSize,
                      fontWeight: '500',
                      color: themeStyle.textContrast
                    }}>
                    {
                      this.props.cartItems2.Config.languageJson2[
                        'Shipping Address'
                      ]
                    }
                  </Text>

                  <Text
                    style={{
                      justifyContent: 'space-between',
                      padding: 10,
                      flex: 1,
                      fontSize: themeStyle.mediumSize,
                      color: themeStyle.textColor
                    }}>
                    {this.state.orderDetail.shipping_method}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: themeStyle.backgroundColor,
                  justifyContent: 'space-between',
                  shadowOffset: { width: 1, height: 1 },
                  shadowColor: themeStyle.textColor,
                  shadowOpacity: 0.5,
                  elevation: 5,
                  flex: 1,
                  margin: 10,
                  marginTop: 10,
                  marginBottom: 5
                }}>
                <View
                  style={{
                    justifyContent: 'space-between',

                    flex: 1
                  }}>
                  <Text
                    style={{
                      justifyContent: 'space-between',
                      padding: 10,
                      flex: 1,
                      backgroundColor: '#d3d3d3',
                      fontSize: themeStyle.largeSize,
                      fontWeight: '500',
                      color: themeStyle.textContrast
                    }}>
                    {this.props.cartItems2.Config.languageJson2.Products}
                  </Text>

                  <FlatList
                    data={this.state.products}
                    extraData={this.state}
                    listKey={'products'}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={item => (
                      <View
                        style={{
                          backgroundColor: themeStyle.backgroundColor
                        }}>
                        <View
                          style={{
                            padding: 6,
                            paddingLeft: 6,
                            fontSize: themeStyle.mediumSize
                          }}>
                          <Text style={{ color: themeStyle.textColor }}>
                            {item.item.products_name}
                          </Text>
                        </View>

                        <View
                          style={{
                            width: '100%',
                            height: 1,
                            backgroundColor: '#d9d9d9'
                          }}
                        />

                        <View
                          style={{
                            justifyContent: 'space-between',
                            padding: 4,
                            paddingLeft: 3,
                            flexDirection: 'row'
                          }}>
                          <ImageLoad
                            key={item.item.id}
                            style={{ height: 90, width: 90 }}
                            loadingStyle={{
                              size: 'large',
                              color: themeStyle.loadingIndicatorColor
                            }}
                            placeholder={false}
                            ActivityIndicator={true}
                            placeholderStyle={{ width: 0, height: 0 }}
                            source={{
                              uri: themeStyle.url + '/' + item.item.image
                            }}
                          />
                          <View
                            style={{
                              padding: 3,
                              paddingLeft: 8,
                              flexDirection: 'column',
                              flex: 1
                            }}>
                            <View
                              style={{
                                justifyContent: 'space-between',
                                padding: 3,
                                paddingLeft: 8,
                                flexDirection: 'row'
                              }}>
                              <Text
                                style={{
                                  fontSize: themeStyle.mediumSize,
                                  fontWeight: 'normal',
                                  color: themeStyle.textColor
                                }}>
                                {
                                  this.props.cartItems2.Config.languageJson2
                                    .Price
                                }{' '}
                                :
                              </Text>
                              <View
                                style={{
                                  justifyContent: 'flex-end',
                                  flexDirection: 'row',
                                  flex: 1
                                }}>
                                <HTML
                                  html={SyncStorage.get('currency')}
                                  baseFontStyle={{
                                    fontSize: themeStyle.mediumSize,
                                    color: themeStyle.textColor
                                  }}
                                />

                                <Text style={{
                                  paddingTop: 0,
                                  color:
                                themeStyle.textColor
                                }}>
                                  {Number(item.item.price).toFixed(2)}
                                </Text>
                              </View>
                            </View>

                            <View
                              style={{
                                justifyContent: 'space-between',
                                padding: 3,
                                paddingLeft: 8,
                                flexDirection: 'row',
                                marginTop: 0,
                                flex: 1
                              }}>
                              <Text
                                style={{
                                  fontSize: themeStyle.mediumSize,
                                  fontWeight: 'normal',
                                  color: themeStyle.textColor
                                }}>
                                {
                                  this.props.cartItems2.Config.languageJson2
                                    .Quantity
                                }{' '}
                                :
                              </Text>

                              <Text
                                style={{
                                  fontSize: themeStyle.mediumSize,
                                  fontWeight: 'normal',
                                  color: themeStyle.textColor
                                }}>
                                {item.item.customers_basket_quantity}
                              </Text>
                            </View>
                            <View
                              style={{
                                justifyContent: 'space-between',
                                padding: 3,
                                paddingLeft: 8,
                                marginTop: -20,
                                flexDirection: 'row',
                                flex: 1
                              }}>
                              <Text
                                style={{
                                  fontSize: themeStyle.largeSize,
                                  fontWeight: 'bold',
                                  color: themeStyle.textColor
                                }}>
                                {
                                  this.props.cartItems2.Config.languageJson2
                                    .Total
                                }{' '}
                                :
                              </Text>
                              <View
                                style={{
                                  justifyContent: 'flex-end',
                                  flexDirection: 'row',
                                  flex: 1
                                }}>
                                <HTML
                                  html={SyncStorage.get('currency')}
                                  baseFontStyle={{
                                    fontSize: themeStyle.largeSize,
                                    color: themeStyle.textColor
                                  }}
                                />
                                <Text
                                  style={{
                                    fontSize: themeStyle.largeSize,
                                    fontWeight: 'bold',
                                    color: themeStyle.textColor
                                  }}>
                                  {`${Number(item.item.total).toFixed(2)}`}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                        <View
                          style={{
                            width: '100%',
                            height: 1,
                            backgroundColor: '#d9d9d9'
                          }}
                        />

                        <View
                          style={{
                            padding: 3,
                            paddingLeft: 8,
                            flexDirection: 'row',
                            justifyContent: 'flex-end',
                            flex: 1,
                            alignItems: 'flex-end'
                          }}
                        />
                      </View>
                    )}
                  />
                </View>
              </View>
              <Text
                style={{
                  justifyContent: 'space-between',
                  padding: 10,
                  flex: 1,
                  backgroundColor: '#d3d3d3',
                  fontSize: themeStyle.largeSize,
                  fontWeight: '500',
                  color: themeStyle.textContrast,
                  margin: 10,
                  marginBottom: -3,
                  shadowOffset: { width: 1, height: 0 },
                  shadowColor: themeStyle.textColor,
                  shadowOpacity: 0.5,
                  elevation: 5
                }}>
                {this.props.cartItems2.Config.languageJson2.SubTotal}
              </Text>
              <View
                style={{
                  backgroundColor: themeStyle.backgroundColor,
                  justifyContent: 'space-between',
                  shadowOffset: { width: 1, height: 1 },
                  shadowColor: themeStyle.textColor,
                  shadowOpacity: 0.5,
                  flex: 1,
                  margin: 10,
                  marginTop: 2,
                  elevation: 4,
                  marginBottom: 13
                }}>
                <View
                  style={{
                    justifyContent: 'space-between',
                    padding: 15,
                    flexDirection: 'row',
                    flex: 1
                  }}>
                  <Text
                    style={{
                      fontSize: themeStyle.mediumSize,
                      color: themeStyle.textColor
                    }}>
                    {
                      this.props.cartItems2.Config.languageJson2[
                        'Products Price'
                      ]
                    }
                  </Text>
                  <View
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      justifyContent: 'flex-end'
                    }}>
                    <HTML
                      html={SyncStorage.get('currency')}
                      baseFontStyle={{
                        fontSize: themeStyle.mediumSize,
                        color: themeStyle.textColor
                      }}
                    />
                    <Text
                      style={{
                        fontSize: themeStyle.mediumSize,
                        fontWeight: '400',
                        color: themeStyle.textColor
                      }}>
                      {Number(this.state.productsTotal).toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    justifyContent: 'space-between',
                    padding: 15,
                    paddingTop: 1,
                    flexDirection: 'row',
                    flex: 1
                  }}>
                  <Text
                    style={{ color: themeStyle.textColor, fontSize: themeStyle.mediumSize }}>
                    {this.props.cartItems2.Config.languageJson2.Tax}
                  </Text>
                  <View
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      justifyContent: 'flex-end'
                    }}>
                    <HTML
                      html={SyncStorage.get('currency')}
                      baseFontStyle={{
                        fontSize: themeStyle.mediumSize,
                        color: themeStyle.textColor
                      }}
                    />
                    <Text
                      style={{
                        fontSize: themeStyle.mediumSize,
                        fontWeight: '400',
                        color: themeStyle.textColor
                      }}>
                      {Number(this.state.orderDetail.total_tax).toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    justifyContent: 'space-between',
                    padding: 15,
                    paddingTop: 1,
                    flexDirection: 'row',
                    flex: 1
                  }}>
                  <Text
                    style={{ color: themeStyle.textColor, fontSize: themeStyle.mediumSize }}>
                    {this.props.cartItems2.Config.languageJson2['Shipping Cost']}
                  </Text>
                  <View
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      justifyContent: 'flex-end'
                    }}>
                    <HTML
                      html={SyncStorage.get('currency')}
                      baseFontStyle={{
                        fontSize: themeStyle.mediumSize,
                        color: themeStyle.textColor
                      }}
                    />
                    <Text
                      style={{
                        fontSize: themeStyle.mediumSize,
                        fontWeight: '400',
                        color: themeStyle.textColor
                      }}>
                      {Number(this.state.orderDetail.shipping_cost).toFixed(2)}
                    </Text>
                  </View>
                </View>

                {this.state.couponApplied == 1 ? (
                  <View
                    style={{
                      justifyContent: 'space-between',
                      padding: 15,
                      paddingTop: 1,

                      flexDirection: 'row',
                      flex: 1
                    }}>
                    <Text
                      style={{
                        color: themeStyle.textColor,
                        fontSize: themeStyle.mediumSize
                      }}>
                      {this.props.cartItems2.Config.languageJson2.Discount}
                    </Text>
                    <View
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        justifyContent: 'flex-end'
                      }}>
                      <HTML
                        html={SyncStorage.get('currency')}
                        baseFontStyle={{
                          fontSize: themeStyle.mediumSize,
                          color: themeStyle.textColor
                        }}
                      />
                      <Text
                        style={{
                          fontSize: themeStyle.mediumSize,
                          fontWeight: '400',
                          color: themeStyle.textColor
                        }}>
                        {Number(this.state.discount).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ) : null}

                <View
                  style={{
                    justifyContent: 'space-between',
                    padding: 15,
                    paddingTop: 1,

                    flexDirection: 'row',
                    flex: 1
                  }}>
                  <Text
                    style={{ color: themeStyle.textColor, fontSize: themeStyle.mediumSize }}>
                    {this.props.cartItems2.Config.languageJson2.Total}
                  </Text>
                  <View
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      justifyContent: 'flex-end'
                    }}>
                    <HTML
                      html={SyncStorage.get('currency')}
                      baseFontStyle={{
                        fontSize: themeStyle.mediumSize,
                        color: themeStyle.textColor
                      }}
                    />
                    <Text
                      style={{
                        fontSize: themeStyle.mediumSize,
                        fontWeight: '400',
                        color: themeStyle.textColor
                      }}>
                      {Number(this.state.totalAmountWithDisocunt).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={{
                  height: 110,
                  backgroundColor: themeStyle.backgroundColor,
                  justifyContent: 'space-between',
                  shadowOffset: { width: 1, height: 1 },
                  shadowColor: themeStyle.textColor,
                  shadowOpacity: 0.5,
                  elevation: 5,
                  flex: 1,
                  margin: 10,
                  marginTop: 5,
                  marginBottom: 5
                }}>
                <TouchableOpacity
                  style={{ paddingTop: 5 }}
                  onPress={() => this.setState({ wrapperCondition: true })}>
                  <View
                    style={{
                      alignItems: 'flex-start',
                      padding: 10,
                      backgroundColor: 'transparent',
                      justifyContent: 'center',
                      paddingLeft: 12,
                      paddingBottom: 5
                    }}>
                    <Text
                      style={{
                        textAlign: 'center',
                        fontSize: themeStyle.mediumSize - 2,
                        color: themeStyle.otherBtnsColor,
                        textDecorationLine: 'underline',
                        fontWeight: 'bold'
                      }}>
                      {
                        this.props.cartItems2.Config.languageJson2[
                          'LIST OF COUPON CODES'
                        ]
                      }
                    </Text>
                  </View>
                </TouchableOpacity>

                <View
                  style={{
                    justifyContent: 'space-between',
                    padding: 12,
                    flexDirection: 'row',
                    flex: 1
                  }}>
                  <TextInput
                    style={{
                      height: 35,
                      borderColor: '#c1c1c1',
                      borderWidth: 1,
                      padding: 4,
                      flex: 2,
                      textAlign: I18nManager.isRTL ? 'right' : 'left',
                      paddingLeft: 10,
                      color: themeStyle.textColor
                    }}
                    selectionColor='#51688F'
                    placeholder={
                      this.props.cartItems2.Config.languageJson2['coupon code']
                    }
                    placeholderTextColor={'#c1c1c1'}
                    onChangeText={couponText =>
                      this.setState({ couponText, errorMessage: '' })
                    }
                    value={this.state.couponText}
                  />

                  <TouchableOpacity
                    disabled={!this.state.couponText}
                    style={{
                      paddingTop: 0,
                      height: 35,
                      width: 60,
                      paddingLeft: 5
                    }}
                    onPress={() => this.getCoupon(this.state.couponText)}>
                    <View
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        opacity: this.state.couponText ? null : 0.4,
                        backgroundColor: themeStyle.otherBtnsColor,
                        justifyContent: 'center',
                        borderRadius: 10 / 2
                      }}>
                      <Text
                        style={{
                          textAlign: 'center',
                          fontSize: themeStyle.mediumSize,
                          color: themeStyle.otherBtnsText,
                          fontWeight: '500'
                        }}>
                        {this.props.cartItems2.Config.languageJson2.Apply}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {this.state.couponArray.length > 0 ? (
                <View
                  style={{
                    backgroundColor: themeStyle.backgroundColor,
                    justifyContent: 'space-between',
                    shadowOffset: { width: 1, height: 1 },
                    shadowColor: themeStyle.textColor,
                    shadowOpacity: 0.5,
                    flex: 1,
                    margin: 10,
                    marginTop: 10,
                    marginBottom: 5,
                    elevation: 5
                  }}>
                  <View
                    style={{
                      justifyContent: 'space-between',
                      flex: 1
                    }}>
                    <Text
                      style={{
                        justifyContent: 'space-between',
                        padding: 10,
                        flex: 1,
                        backgroundColor: '#d3d3d3',
                        fontSize: themeStyle.largeSize,
                        fontWeight: '500',
                        color: themeStyle.textContrast
                      }}>
                      {this.props.cartItems2.Config.languageJson2.Coupon}
                    </Text>

                    <FlatList
                      data={this.state.couponArray}
                      extraData={this.state}
                      listKey={'coupon'}
                      keyExtractor={(item, index) => index.toString()}
                      renderItem={
                        item => (
                          <View
                            style={{
                              backgroundColor: themeStyle.backgroundColor,
                              justifyContent: 'space-between',
                              flex: 1,
                              margin: 10,
                              marginTop: 5,
                              marginBottom: 2
                            }}>
                            <View
                              style={{
                                justifyContent: 'space-between',
                                padding: 15,
                                flexDirection: 'row',
                                paddingBottom: 0,
                                paddingTop: 15
                              }}>
                              <Text
                                style={{
                                  textAlign: 'center',
                                  fontSize: themeStyle.mediumSize,
                                  color: themeStyle.textColor
                                }}>
                                {
                                  this.props.cartItems2.Config.languageJson2[
                                    'Coupon Code'
                                  ]
                                }
                              </Text>
                              <Text
                                style={{
                                  textAlign: 'center',
                                  fontSize: themeStyle.mediumSize,
                                  color: themeStyle.textColor
                                }}>
                                {item.item.code}
                              </Text>
                            </View>

                            <View
                              style={{
                                justifyContent: 'space-between',
                                padding: 15,
                                flexDirection: 'row',
                                paddingBottom: 0,
                                paddingTop: 12
                              }}>
                              <Text
                                style={{
                                  textAlign: 'center',
                                  fontSize: themeStyle.mediumSize,
                                  color: themeStyle.textColor
                                }}>
                                {
                                  this.props.cartItems2.Config.languageJson2[
                                    'Coupon Amount'
                                  ]
                                }
                              </Text>
                              <View
                                style={{
                                  flex: 1,
                                  flexDirection: 'row',
                                  justifyContent: 'flex-end'
                                }}>
                                <HTML
                                  html={SyncStorage.get('currency')}
                                  baseFontStyle={{
                                    fontSize: themeStyle.mediumSize,
                                    color: themeStyle.textColor
                                  }}
                                />
                                <Text
                                  style={{
                                    textAlign: 'center',
                                    fontSize: themeStyle.mediumSize,
                                    color: themeStyle.textColor
                                  }}>
                                  {item.item.amount}
                                </Text>
                              </View>
                            </View>
                            <View
                              style={{
                                justifyContent: 'space-between',
                                padding: 15,
                                paddingTop: 12,
                                flexDirection: 'row',
                                paddingBottom: 0,
                                backgroundColor: themeStyle.backgroundColor
                              }}>
                              <Text
                                style={{
                                  fontSize: themeStyle.mediumSize,
                                  color: themeStyle.textColor
                                }}>
                                {item.item.discount_type === 'fixed_product'
                                  ? this.props.cartItems2.Config.languageJson2[
                                    'A fixed total discount for selected products only'
                                  ]
                                  : null}
                                {item.item.discount_type === 'fixed_cart'
                                  ? this.props.cartItems2.Config.languageJson2[
                                    'A fixed total discount for the entire cart'
                                  ]
                                  : null}
                                {item.item.discount_type === 'percent_product'
                                  ? this.props.cartItems2.Config.languageJson2[
                                    'A percentage discount for selected products only'
                                  ]
                                  : null}
                                {item.item.discount_type === 'percent'
                                  ? this.props.cartItems2.Config.languageJson2[
                                    'A percentage discount for the entire cart'
                                  ]
                                  : null
                                }
                              </Text>
                            </View>

                            <View
                              style={{
                                justifyContent: 'space-between',
                                padding: 12,
                                paddingTop: 8,
                                flexDirection: 'row'
                              }}>
                              <TouchableOpacity
                                style={{
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRadius: 6
                                }}
                                onPress={() =>
                                  this.deleteCoupon(item.item.code)
                                }>
                                <View
                                  style={{
                                    flex: 1,
                                    alignItems: 'center',
                                    backgroundColor: themeStyle.removeBtnColor,
                                    justifyContent: 'center',
                                    padding: 6,
                                    borderRadius: 10
                                  }}>
                                  <Text
                                    style={{
                                      textAlign: 'center',
                                      fontSize: themeStyle.mediumSize,
                                      color: 'white',
                                      fontWeight: '500'
                                    }}>
                                    {
                                      this.props.cartItems2.Config.languageJson2
                                        .Remove
                                    }
                                  </Text>
                                </View>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )
                      }
                    />
                  </View>
                </View>
              ) : null}

              <View
                style={{
                  backgroundColor: themeStyle.backgroundColor,
                  justifyContent: 'space-between',
                  shadowOffset: { width: 1, height: 1 },
                  shadowColor: themeStyle.textColor,
                  shadowOpacity: 0.5,
                  flex: 1,
                  margin: 10,
                  marginTop: 10,
                  marginBottom: 5,
                  elevation: 5
                }}>
                <View
                  style={{
                    justifyContent: 'space-between',

                    flex: 1
                  }}>
                  <Text
                    style={{
                      justifyContent: 'space-between',
                      padding: 10,
                      flex: 1,
                      backgroundColor: '#d3d3d3',
                      fontSize: themeStyle.largeSize,
                      fontWeight: '500',
                      color: themeStyle.textContrast
                    }}>
                    {this.props.cartItems2.Config.languageJson2['Order Notes']}
                  </Text>

                  <TextInput
                    style={{
                      height: 38,
                      borderColor: '#c1c1c1',
                      borderWidth: 1,
                      paddingLeft: 4,
                      textAlign: I18nManager.isRTL ? 'right' : 'left',
                      color: themeStyle.textColor
                    }}
                    selectionColor={'#c1c1c1'}
                    placeholder={`${this.props.cartItems2.Config.languageJson2['Note to the buyer']}`}
                    placeholderTextColor={'#c1c1c1'}
                    onChangeText={customerNotes => {
                      this.setState({ customerNotes })
                    }}
                    value={this.state.customerNotes}
                  />
                </View>
              </View>

              <IPay88
          successNotify={this.successNotify}
          failedNotify={this.failedNotify}
          cancelNotify={this.cancelNotify}
        />
        {/* <TouchableOpacity
                  onPress={()=>this.pay(SyncStorage.get('customerData').customers_id.toString(),
                  SyncStorage.get('customerData').customers_firstname.toString(),
                  SyncStorage.get('customerData').email.toString(),
                  SyncStorage.get('customerData').customers_telephone.toString(),
                  this.state.totalAmountWithDisocunt.toFixed(2)

                  )}
                  style={{
                    backgroundColor: themeStyle.backgroundColor,
                    justifyContent: 'center',
                    shadowOffset: { width: 1, height: 1 },
                    shadowColor: themeStyle.textColor,
                    shadowOpacity: 0.5,
                    flex: 1,
                    margin: 10,
                    elevation: 5
                  }}>
                    <Text style={{textAlign:"center",fontSize: themeStyle.largeSize,backgroundColor: '#c1c1c1',paddingVertical:10,color:themeStyle.textColor}}>Pay</Text>
                    </TouchableOpacity> */}

              {this.state.paymentShowCondition ? (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <UIActivityIndicator
                    size={27}
                    color={themeStyle.loadingIndicatorColor}
                  />
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => this.setState({ wrapperCondition2: true })}
                  style={{
                    backgroundColor: themeStyle.backgroundColor,
                    justifyContent: 'space-between',
                    shadowOffset: { width: 1, height: 1 },
                    shadowColor: themeStyle.textColor,
                    shadowOpacity: 0.5,
                    flex: 1,
                    margin: 10,
                    marginTop: 10,
                    marginBottom: 10,
                    elevation: 5
                  }}>
                  <View
                    style={{
                      justifyContent: 'space-between',
                      flex: 1
                    }}>
                    <View
                      style={{
                        justifyContent: 'space-between',
                        flex: 1
                      }}>
                      {this.singaleRow(
                        this.props.cartItems2.Config.languageJson2.Payment,
                        Number(this.state.tax).toFixed(2),
                        true
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              {this.state.paymentText === 'Stripe' ? (
                <CardTextFieldScreen
                  setTokenFun={t => this.setTokenFun(t)}
                  setParams={t => this.setParams(t)}></CardTextFieldScreen>
              ) : null}
            </View>
          )}
        />
      </View>
    )
  }
}
const mapStateToProps = state => ({
  cartItems2: state
})

const mapDispatchToProps = dispatch => ({
  productDeleteIdFun: (value, msg, check) => {
    dispatch({
      type: 'OUT_OF_STOCK_PRODUCT',
      productDeleteId: value,
      msg: msg,
      check: check
    })
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(orderScreen)