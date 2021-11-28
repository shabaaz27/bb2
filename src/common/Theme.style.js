import { Dimensions } from 'react-native'
import uuid from 'react-native-uuid'
const WIDTH = Dimensions.get('window').width
// set card width according to your requirement
const cardWidth = WIDTH * 0.3991
// cardWidth= WIDTH * 0.4191 // card width for two and half card
// cardWidth= WIDTH * 0.6191 // one and half
// cardWidth= WIDTH * 0.42
const cIp = '192.168.1.' + Math.floor(Math.random() * 99) + 1 // default
const cDid = uuid.v4()
export default {
  /// /////////////////////////////

  url: 'https://bb2go.com', //your site URL
  consumerKey: '4a2ff3ce1611721896799bd518', // Your consumer key
  consumerSecret: 'aa3f81111611721896d1a3421d', // Your consumer secret

  webClientIdForGoogleSign: '805890784697-a30cohp5jjp6oq9q1ke8tkutvbk3jcfg.apps.googleusercontent.com',// webClientId For Google SignIn
  /// //// navigation
  homeTitle: 'BB2GO',
  bottomNavigation: false,
  // please reset app cache after changing these five values
  defaultCurrencySymbol: 'RM',
  defaultCurrencyCode: 'MYR',
  priceDecimals: 2,
  // by default language for ltr
  ltrlanguageCode: 'en',
  // by default language for rtl
  rtllanguageCode: 'ar',

  // Banners props
  autoplay: true,
  autoplayDelay: 5,
  autoplayLoop: true,
  StatusBarColor: '#9E8987',
  // --ion-color-primary-shade: #374e02;
  barStyle: 'light-content', // dark-content, default

  headerTintColor: 'rgb(255, 255, 255)',
  headerIconsColor: 'rgb(255, 255, 255)',

  primaryDark: '#866E6C',
  primary: '#866E6C',
  primaryContrast: '#ffffff',
  // backgroundColor: '#F2F2F2',// color for card style 11
  // backgroundColor: '#fdfcfa',
  backgroundColor: '#fdfdfd',
  textColor: '#000',
  textContrast: '#000',

  google: '#dd4b39',
  facebook: '#3b5998',

  // Button Colors
  addToCartBtnColor: '#866E6C',
  addToCartBtnTextColor: '#fff',
  // addToCartBagBtnColor: '#4E4E4E',
  addToCartBagBtnColor: '#866E6C',

  outOfStockBtnColor: '#D81800',
  outOfStockBtnTextColor: '#fff',

  detailsBtnColor: '#866E6C',
  detailsBtnTextColor: '#fff',
  removeBtnColor: '#D81800',
  removeBtnTextColor: '#fff',
  wishHeartBtnColor: '#866E6C',
  otherBtnsColor: '#866E6C',
  otherBtnsText: '#fff',

  saleBackgroundColor: '#866E6C',
  saleTextColor: '#fff',
  featuredBackgroundColor: '#866E6C',
  featuredTextColor: '#fff',
  newBackgroundColor: '#D81800',
  newTextColor: '#fff',

  priceColor: '#866E6C',

  /// ///////// font size

  largeSize: 16,
  mediumSize: 14,
  smallSize: 12,

  /// //////// cartWidth
  singleRowCardWidth: cardWidth,
  twoRowCardWIdth: 0.465,
  loadingIndicatorColor: '#866E6C',
  ipAdress: cIp,
  deviceId: cDid
}
