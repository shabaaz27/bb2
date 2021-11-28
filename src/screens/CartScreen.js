import React, { Component } from 'react'
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  Button,
  TouchableOpacity,
  Dimensions,
  Platform
} from 'react-native'
import WooComFetch, { getUrl, postHttp, getHttp } from '../common/WooComFetch'

import { UIActivityIndicator } from 'react-native-indicators'
import BottomNav from '../common/BottomNav'
import { CardStyleInterpolators } from 'react-navigation-stack'
import Toast from 'react-native-easy-toast'
import { Icon } from 'native-base'
import Spinner from 'react-native-loading-spinner-overlay'
import { withNavigation, NavigationEvents } from 'react-navigation'
import { connect } from 'react-redux'
import Counter from '../common/Counter'
import SyncStorage from 'sync-storage'
import HTML from 'react-native-render-html'
import ImageLoad from '../common/RnImagePlaceH'
import ShoppingCartIcon from '../common/ShoppingCartIcon'
import themeStyle from '../common/Theme.style'
import { createSelector } from 'reselect'
const WIDTH = Dimensions.get('window').width
class Cart extends Component {
  static navigationOptions = ({ navigation }) => {
    const headerStyle = navigation.getParam('headerTitle')
    return {
      headerTitle: headerStyle,
      headerRight: () => <ShoppingCartIcon navigation={navigation} />,
      headerForceInset: { top: 'never', vertical: 'never' },
      headerTintColor: themeStyle.headerTintColor,
      headerStyle: {
        backgroundColor: themeStyle.primary
      },
      headerTitleStyle: {
        fontWeight: Platform.OS === 'android' ? 'bold' : 'normal'
      },
      headerTitleAlign: 'center',
      cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS
    }
  }

  constructor (props) {
    super(props)
    this.state = {
      stepperArray: [],
      subTotal: [],
      value: [],
      totalSumPrice: 0,
      listTotal: 0,
      total: '',
      subtotal: '',
      c: '',
      couponArray: [],
      products: this.props.cartProductArrayViewedProducts,
      // products:[],
      loadingServerData: true,
      productTemp: [],
      SpinnerTemp: true,
      couponText: '',
      wrapperCondition: false,
      wrapperAlert: false,
      alertText: '',
      uri: '',
      activityIndicatorTemp: false
    }
    this.toast = null
  }

  //= ===========================================================================================
  componentDidMount () {
    this.setState({ activityIndicatorTemp: false })
    SyncStorage.set('Country', 'Country')
    SyncStorage.set('cartScreen', 1)
    this.props.navigation.setParams({
      headerTitle: this.props.language2['Cart Page'],
      temp: this.props.navigation
    })
    this.setState({ SpinnerTemp: false })
    this.getNewCartInfo()
    this.totalPrice()
    
  }

  /// //////////////////testing

   //= ====================================================
   getNewCartInfo = async () => {
     const newProducts = []
     let count = 0
     const oldProductsIds = this.getCartProductsIds()
     oldProductsIds.forEach(async element => {
       var dat = {}
       dat.products_id = element
       dat.language_id = SyncStorage.get('langId') === undefined
         ? '1'
         : SyncStorage.get('langId')
       dat.currency_code = this.props.currency
       const data = await postHttp(getUrl() + '/api/' + 'getallproducts', dat)
       count++
       if (data.success == 1) {
         newProducts.push(data.product_data[0])
       }
       if (count == oldProductsIds.length) {
         this.updateProductsInfo(newProducts)
       }
     })
   }

   /// ///////////////////////////
   getCartProductsIds () {
     const arr = []
     this.props.cartProductArrayViewedProducts.forEach(element => {
       arr.push(element.products_id)
     })
     return arr
   }

   /// ///////////////////////////////////////////////////////
   updateProductsInfo (array) {
     const tempArrayDeleteProductsOld = JSON.parse(JSON.stringify(this.props.cartProductArrayViewedProducts))
     this.props.clearCart()
     array.forEach(newProduct => {
       if (newProduct.attributes.length == 0) {
         this.props.addItemToCart2(newProduct, [])
       } else {
         tempArrayDeleteProductsOld.forEach(oldProduct => {
           if (newProduct.products_id == oldProduct.products_id) {
             const newAtt = this.fillAttributes(oldProduct.attributes, newProduct.attributes)

             this.props.addItemToCart2(newProduct, newAtt)
           }
         })
       }
     })
     tempArrayDeleteProductsOld.forEach(element => {
       this.props.cartProductArrayViewedProducts.forEach(element2 => {
         if (element.products_id == element2.products_id && element.cart_id == element2.cart_id) {
           element2.customers_basket_quantity = element.customers_basket_quantity
           element2.subtotal = element2.final_price * element2.customers_basket_quantity
           element2.total = element2.subtotal
         }
       })
     })
     this.setState({ products: this.props.cartProductArrayViewedProducts })
     this.totalPrice()
     this.setState({ SpinnerTemp: false })
     // this.state.product=this.props.cartProductArrayViewedProducts;
   }

   //= ===========================================================================================
   // below code to get new attributes in the products
   fillAttributes (oldAtts, newAtts) {
     const updatedAtts = []
     oldAtts.forEach(oldValue => {
       const newValueForUpdate = this.getNewValueInfo(oldValue, newAtts)
       const att = {
         products_options_id: oldValue.products_options_id,
         products_options: oldValue.products_options,
         products_options_values_id: newValueForUpdate.id,
         options_values_price: newValueForUpdate.price,
         price_prefix: newValueForUpdate.price_prefix,
         products_options_values: newValueForUpdate.value,
         attribute_id: newValueForUpdate.products_attributes_id,
         name: newValueForUpdate.value + ' ' + newValueForUpdate.price_prefix + newValueForUpdate.price + ' ' + this.props.currency
       }
       updatedAtts.push(att)
     })
     return updatedAtts
   };

   //= ===========================================
   getNewValueInfo (oldOption, newAtts) {
     let valueToReturn = {}
     newAtts.forEach(element => {
       if (element.option.id == oldOption.products_options_id) {
         element.values.forEach(element2 => {
           if (oldOption.attribute_id == element2.products_attributes_id) {
             valueToReturn = element2
           }
         })
       }
     })
     return valueToReturn
   }
   /// //////////////////////////////////////

getSingleProductDetail= async (id) => {
  var dat = {}
  if (SyncStorage.get('customerData') != null) { dat.customers_id = SyncStorage.get('customerData').customers_id } else { dat.customers_id = null }
  dat.products_id = id
  dat.language_id = SyncStorage.get('langId') === undefined
    ? '1'
    : SyncStorage.get('langId')
  dat.currency_code = this.props.currency

  const data = await postHttp(getUrl() + '/api/' + 'getallproducts', dat)
  if (data.success === '1') {
    const temp = data.product_data[0]
    return temp
  } else {
    return null
  }
  return null
}

  /// ////////////////////////////////////////////////////////
  //= ===========================================================================================
  totalPrice = () => {
    var price = 0
    for (const value of this.props.cartProductArrayViewedProducts) {
      var pp = value.final_price * value.customers_basket_quantity
      price = price + pp
    }
    this.setState({
      total: price
    })
  }

  //= ===========================================================================================
  removeCart = id => {
    this.props.cartProductArrayViewedProducts.forEach((value, index) => {
      if (value.cart_id === id) {
        this.props.cartProductArrayViewedProducts.splice(index, 1)
        SyncStorage.set(
          'cartProducts',
          this.props.cartProductArrayViewedProducts
        )
      }
    })
    this.totalPrice()
    this.setState({ SpinnerTemp: true })
    this.props.cartTotalItems(this)
    this.setState({ products: this.props.cartProductArrayViewedProducts })
  }

  //= ===========================================================================================
  qunatityPlus = q => {
    q.customers_basket_quantity++
    q.subtotal = q.final_price * q.customers_basket_quantity
    q.total = q.subtotal
    this.totalPrice()
    this.setState({ SpinnerTemp: true })
    this.props.cartTotalItems(this)
    SyncStorage.set(
      'cartProducts',
      this.props.cartProductArrayViewedProducts
    )
  }

  //= ===========================================================================================
  // function decreasing the quantity
  qunatityMinus = q => {
    if (q.customers_basket_quantity === 1) {
      return 0
    }
    q.customers_basket_quantity--
    q.subtotal = q.final_price * q.customers_basket_quantity
    q.total = q.subtotal
    this.totalPrice()
    this.setState({ SpinnerTemp: true })
    this.props.cartTotalItems(this)
    SyncStorage.set(
      'cartProducts',
      this.props.cartProductArrayViewedProducts
    )
  }

  gotoNextPage = async (item) => {
    this.setState({ SpinnerTemp: true })
    const objectArray = await this.getSingleProductDetail(item.products_id)
    this.setState({ SpinnerTemp: false })
    if (objectArray !== null) {
      this.props.navigation.push('ProductDetails', {
        objectArray: objectArray,
        updateCart: () => {
          this.totalPrice()
          this.setState({
            activityIndicatorTemp: false,
            products: this.props.cartProductArrayViewedProducts
          })
        }
      })
    }
  }

  proceedToCheckOut = () => {
    SyncStorage.set('webviewActive', true)
    if (
      SyncStorage.get('customerData') === null ||
      SyncStorage.get('customerData') === undefined ||
      SyncStorage.get('customerData') === '' ||
      SyncStorage.get('gustLogin')
    ) {
      SyncStorage.set('cartScreen', 1)
      this.props.navigation.push('LoginScreen')
    } else {
      // <!-- 2.0 updates -->
      if (this.props.checkOutPage == 1) {
        this.props.navigation.push('WebViewScreen', {
          onePageCheckOut2: false
          //
        })
      } else {
        this.props.navigation.navigate('ShippingAddressScreen')
      }
    }
  }

checkFun=() => {
  this.props.setCheck()
}

//= ===========================================================================================
render () {
  return this.state.activityIndicatorTemp ? (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        backgroundColor: themeStyle.backgroundColor
      }}>
      <UIActivityIndicator
        size={27}
        color={themeStyle.loadingIndicatorColor}
      />
    </View>
  ) : this.props.cartProductArrayViewedProducts.length === 0 ? (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: themeStyle.backgroundColor,
      fontSize: 25,
      paddingBottom: SyncStorage.get('bottom') ? 50 : 0
    }}>
      <NavigationEvents
        onDidFocus={() => {
          this.totalPrice()
        }}
      />
      {SyncStorage.get('bottom') ? (
        <BottomNav
          active={3}
          home={
            this.props.homePage === 1
              ? 'Home1Screen'
              : this.props.homePage === 2
                ? 'Home2Screen'
                : this.props.homePage === 3
                  ? 'Home3Screen'
                  : this.props.homePage === 4
                    ? 'Home4Screen'
                    : this.props.homePage === 5
                      ? 'Home5Screen'
                      : this.props.homePage === 6
                        ? 'Home6Screen'
                        : this.props.homePage === 7
                          ? 'Home7Screen'
                          : this.props.homePage === 8
                            ? 'Home8Screen'
                            : this.props.homePage === 9
                              ? 'Home9Screen'
                              : 'Home10Screen'
          }></BottomNav>
      ) : null}
      <Icon name={'md-cart'} style={{ color: 'gray', fontSize: 80 }} />
      <View>
        <Text style={styles.welcome, { color: themeStyle.textColor }}>
          {this.props.language2['Your cart is empty']}
        </Text>
        <Text style={styles.textStyle}>
          {this.props.language2['Continue Shopping']}
        </Text>
        <TouchableOpacity
          style={{ paddingTop: 5, width: 90, alignSelf: 'center' }}
          onPress={() =>
            this.props.navigation.navigate('NewestScreen', {
              id: undefined,
              name: undefined,
              sortOrder: 'Newest'
            })
          }>
          <View
            style={{
              borderColor: themeStyle.otherBtnsColor,
              alignItems: 'center',
              height: 33,
              width: 90,
              backgroundColor: themeStyle.otherBtnsColor,
              justifyContent: 'center',
              elevation: 0.3,
              marginTop: 5
            }}>
            <Text
              style={{
                textAlign: 'center',
                color: themeStyle.otherBtnsText,
                fontSize: 16
              }}>
              {this.props.language2.Explore}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  ) : this.state.products.length === 0 ? (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: themeStyle.backgroundColor }}>
      <NavigationEvents
        onDidFocus={() => {
          this.totalPrice()
        }}
      />
      <UIActivityIndicator
        size={27}
        color={themeStyle.loadingIndicatorColor}
      />
    </View>
  ) : (
    <View style={{ flex: 1, backgroundColor: themeStyle.backgroundColor }}>
      {SyncStorage.get('bottom') ? (
        <BottomNav
          active={3}
          home={
            this.props.homePage === 1
              ? 'Home1Screen'
              : this.props.homePage === 2
                ? 'Home2Screen'
                : this.props.homePage === 3
                  ? 'Home3Screen'
                  : this.props.homePage === 4
                    ? 'Home4Screen'
                    : this.props.homePage === 5
                      ? 'Home5Screen'
                      : this.props.homePage === 6
                        ? 'Home6Screen'
                        : this.props.homePage === 7
                          ? 'Home7Screen'
                          : this.props.homePage === 8
                            ? 'Home8Screen'
                            : this.props.homePage === 9
                              ? 'Home9Screen'
                              : 'Home10Screen'
          }></BottomNav>
      ) : null}
      <NavigationEvents
        onDidFocus={() => {
          this.setState({ SpinnerTemp: true }, () => {
            this.getNewCartInfo()
          })
          this.totalPrice()
        }}
      />
      <Spinner
        visible={this.state.SpinnerTemp}
        textStyle={{
          color: themeStyle.loadingIndicatorColor,
          backgroundColor: themeStyle.loadingIndicatorColor
        }}
      />

      <FlatList
        showsVerticalScrollIndicator={false}
        data={this.state.products}
        contentContainerStyle={{ marginBottom: 40 }}
        extraData={this.state}
        keyExtractor={(item, index) => index.toString()}
        renderItem={item => (
          <View>
            {this.props.productDeleteId === item.item.products_id &&
                 this.toast != undefined && this.props.check
              ? this.toast.show(this.props.productErrorMsg) : null}

            {this.props.productDeleteId === item.item.products_id &&
                 this.toast != undefined && this.props.check
              ? this.checkFun() : null}

            <View
              style={{
                backgroundColor: themeStyle.backgroundColor,
                justifyContent: 'space-between',
                shadowOffset: { width: 1, height: 1 },
                shadowColor: themeStyle.textColor,
                shadowOpacity: 0.5,
                flex: 1,
                margin: 10,
                marginTop: 5,
                marginBottom: 2,
                elevation: 5,
                borderWidth: 1,
                borderColor: this.props.productDeleteId === item.item.products_id ? 'red' : 'white'
              }}>
              <View
                style={{
                  padding: 3,
                  color: themeStyle.textColor,
                  paddingLeft: 6
                }}>
                <Text
                  style={{
                    textAlign: 'left',
                    fontSize: themeStyle.smallSize,
                    color: themeStyle.textColor
                  }}>
                  {item.item.products_name}
                </Text>
              </View>

              <View
                style={{
                  height: 1,
                  backgroundColor: '#d9d9d9'
                }}
              />

              <View
                style={{
                  padding: 4,
                  flexDirection: 'row'
                }}>
                <ImageLoad
                  key={item.item.id}
                  style={{ height: 100, width: 100 }}
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
                      {this.props.language2.Price} :
                      {'        '}
                    </Text>
                    <View style={{ flexDirection: 'row', paddingRight: 5 }}>
                      <HTML
                        html={SyncStorage.get('currency')}
                        baseFontStyle={{
                          fontSize: themeStyle.mediumSize - 1,
                          color: themeStyle.textColor
                        }}
                      />
                      <Text
                        style={{
                          color: themeStyle.textColor,
                          fontSize: themeStyle.mediumSize - 1
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
                      flex: 1,
                      paddingTop: 8
                    }}>
                    <Text
                      style={{
                        fontSize: themeStyle.mediumSize,
                        fontWeight: 'normal',
                        color: themeStyle.textColor,
                        paddingTop: 1
                      }}>
                      {this.props.language2.Quantity} :{' '}
                    </Text>
                    <Counter
                      width={24}
                      height={1}
                      minimumValue={1}
                      innerRef={stepper => {
                        this.state.stepperArray[item.index] = stepper
                      }}
                      initialValue={item.item.customers_basket_quantity}
                      onIncrement={() => {
                        this.qunatityPlus(item.item)
                      }}
                      onDecrement={() => {
                        this.qunatityMinus(item.item)
                      }}
                    />
                  </View>

                  <View
                    style={{
                      justifyContent: 'space-between',
                      padding: 3,
                      paddingLeft: 8,
                      flexDirection: 'row',
                      flex: 1,
                      paddingTop: 0
                    }}>
                    <Text
                      style={{
                        fontSize: themeStyle.mediumSize + 1,
                        fontWeight: 'bold',
                        color: themeStyle.textColor
                      }}>
                      {this.props.language2['Sub Total']}{' '}
                        :{' '}
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
                          fontSize: themeStyle.mediumSize + 1,
                          color: themeStyle.textColor
                        }}
                      />
                      <Text
                        style={{
                          fontSize: themeStyle.mediumSize + 1,
                          color: themeStyle.textColor
                        }}>
                        {`${item.item.total.toFixed(2)}`}
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

              {item.item !== null && item.item !== undefined ? (
                item.item.attributes !== null &&
                  item.item.attributes !== undefined ? (
                    <View
                      style={{
                        backgroundColor: themeStyle.backgroundColor,
                        padding: 8,
                        paddingTop: 1,
                        paddingBottom: 0,
                        paddingLeft: WIDTH * 0.32
                      }}>
                      {item.item.attributes.map(att => (
                        <View style={{ flexDirection: 'row', paddingTop: 2 }}>
                          <Text
                            style={{
                              fontSize: themeStyle.mediumSize,
                              color: themeStyle.textColor,
                              fontWeight:
                                Platform.OS === 'android' ? '600' : '400'
                            }}>
                            {att.products_options_values +
                              ' ' +
                              att.products_options +
                              ' :  '}
                          </Text>

                          <Text
                            style={{
                              fontSize: themeStyle.mediumSize,
                              color: themeStyle.textColor,
                              fontWeight:
                                Platform.OS === 'android' ? '600' : '400'
                            }}>
                            {att.price_prefix +
                              ' ' +
                              att.options_values_price +
                              ' ' +
                              SyncStorage.get('currency')}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null
              ) : null}

              <View
                style={{
                  padding: 3,
                  paddingLeft: 8,
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  flex: 1,
                  alignItems: 'flex-start',
                  paddingTop: 5
                }}>
                <Button
                  onPress={() => {
                    this.gotoNextPage(item.item)
                  }
                  }
                  title={
                    ' ' + this.props.language2.View + ' '
                  }
                  color={themeStyle.otherBtnsColor}
                />
                <View
                  style={{
                    marginLeft: 18,
                    marginTop: Platform.OS === 'ios' ? 2 : 0
                  }}>
                  <TouchableOpacity
                    style={{
                      opacity: !this.state.addToHomePageValue ? null : 0.6
                    }}
                    onPress={() => {
                      this.removeCart(item.item.cart_id)
                      for (
                        let i = 0;
                        i <
                          this.props.cartProductArrayViewedProducts
                            .length;
                        i++
                      ) {
                        this.state.stepperArray[i].setValue(
                          this.props.cartProductArrayViewedProducts[i]
                            .customers_basket_quantity
                        )
                      }
                    }}>
                    <View
                      style={{
                        borderColor: '#fff',
                        alignItems: 'center',
                        height: 36,
                        justifyContent: 'center',
                        backgroundColor: 'transparent'
                      }}>
                      <Text
                        style={{
                          color: themeStyle.outOfStockBtnColor,
                          fontSize: themeStyle.mediumSize + 1,
                          fontWeight: '500'
                        }}>
                        {this.props.language2.REMOVE}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View
            style={{
              backgroundColor: themeStyle.backgroundColor,
              justifyContent: 'space-between',
              shadowOffset: { width: 1, height: 1 },
              shadowColor: themeStyle.textColor,
              shadowOpacity: 0.5,
              flex: 1,
              margin: 10,
              marginTop: 5,
              elevation: 4,
              marginBottom: 13,
              borderWidth: 1,
              borderColor: themeStyle.primaryContrast
            }}>
            <View
              style={{
                justifyContent: 'space-between',
                padding: 15,
                flexDirection: 'row',
                flex: 1
              }}>
              <Text
                style={{ color: '#707070', fontSize: themeStyle.mediumSize }}>
                {this.props.language2.Total}
              </Text>
              <View style={{ flexDirection: 'row' }}>
                <HTML
                  html={SyncStorage.get('currency')}
                  baseFontStyle={{
                    fontSize: themeStyle.mediumSize + 1,
                    color: '#707070'
                  }}
                />
                <Text
                  style={{
                    color: '#707070',
                    paddingTop: 1,
                    fontSize: themeStyle.mediumSize
                  }}>
                  {Number(this.state.total).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        }
      />
      <TouchableOpacity
        style={{ marginBottom: SyncStorage.get('bottom') ? 50 : 0 }}
        onPress={() => this.proceedToCheckOut()}
      >
        <View
          style={{
            borderColor: '#fff',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: themeStyle.otherBtnsColor,
            elevation: 2,
            width: WIDTH
          }}>
          <Text
            style={{
              color: themeStyle.otherBtnsText,
              fontSize: themeStyle.mediumSize,
              padding: 10
            }}>
            {/* {this.props.language2.Proceed} */}
            Make Payment
          </Text>
        </View>
      </TouchableOpacity>
      <Toast
        ref={ref => { this.toast = ref }}
        style={{ backgroundColor: '#c1c1c1' }}
        position='bottom'
        positionValue={200}
        fadeOutDuration={10000}
        textStyle={{ color: themeStyle.textColor, fontSize: 15 }}
      />
    </View>
  )
}
}
const getCurrency = (state) => state.Config.productsArguments.currency
const getLanguage2 = (state) => state.Config.languageJson2
const getLanguage = (state) => state.Config.languageJson
const getHomePage = (state) => state.Config.homePage
const getcartProductArray = (state) => state.cartItems.cartProductArray
const getcheckOutPage = (state) => state.Config.checkOutPage

const getLanguageFun = createSelector(
  [getLanguage],
  (getLanguage) => {
    return getLanguage
  }
)
const getLanguageFun2 = createSelector(
  [getLanguage2],
  (getLanguage2) => {
    return getLanguage2
  }
)
const getCurrencyFun = createSelector(
  [getCurrency],
  (getCurrency) => {
    return getCurrency
  }
)

const getHomePageProducts = createSelector(
  [getHomePage],
  (getHomePage) => {
    return getHomePage
  }
)
const getcartProductArrayProducts = createSelector(
  [getcartProductArray],
  (getcartProductArray) => {
    return getcartProductArray
  }
)
const getcheckOutPageFun = createSelector(
  [getcheckOutPage],
  (getcheckOutPage) => {
    return getcheckOutPage
  }
)

const mapStateToProps = state => {
  return {
    cartProductArrayViewedProducts: state.cartItems.cartProductArray,
    productDeleteId: state.cartItems.productDeleteId,
    productErrorMsg: state.cartItems.productErrorMsg,
    check: state.cartItems.check,
    checkOutPage: getcheckOutPageFun(state),
    homePage: getHomePageProducts(state),
    language: getLanguageFun(state),
    language2: getLanguageFun2(state),
    currency: getCurrencyFun(state)
  }
}

const mapDispatchToProps = dispatch => ({
  removeItemToCart: (productObject, productQuantity) =>
    dispatch({
      type: 'REMOVE_TO_CARTS_QUANTITY',
      product: productObject,
      cartProductQuantity: productQuantity,
      variation: null,
      metaData: null
    }),
  setCheck: () => {
    dispatch({
      type: 'SET_CHECK'
    })
  },
  addItemToCart2: (product, attributes) => {
    dispatch({
      type: 'ADD_TO_CARTS',
      product,
      attributes
    })
  },
  addItemToCart: (productObject, productQuantity) => {
    dispatch({
      type: 'ADD_TO_CARTS_QUANTITY',
      product: productObject,
      cartProductQuantity: productQuantity,
      variation: null,
      metaData: null
    })
  },
  removeCardFromCart: productObject =>
    dispatch({
      type: 'REMOVE_CARD_FROM_CART',
      product: productObject,
      variation: null,
      metaData: null
    }),
  setIndicator: temp => {
    dispatch({
      type: 'SET_INDICATOR',
      value: temp,
      OnScreen: true
    })
  },
  clearCart: temp => {
    dispatch({
      type: 'CLEAR_CART'
    })
  },
  setIndicator2: temp => {
    dispatch({
      type: 'SET_INDICATOR',
      value: temp,
      OnScreen: false
    })
  },
  cartTotalItems: (th) => {
    requestAnimationFrame(() => {
      dispatch({
        type: 'CART_TOTAL_ITEMS'
      })
      th.setState({ SpinnerTemp: false })
    })
  },
  productTotal: () => {
    dispatch({
      type: 'PRODUCT_TOTAL'
    })
  },
  spliceItem: temp => {
    dispatch({
      type: 'SPLICE',
      index: temp
    })
  }
})
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withNavigation(Cart))
const styles = StyleSheet.create({
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5
  },
  textStyle: {
    fontSize: 15,
    textAlign: 'center',
    margin: 2,
    color: 'gray'
  }
})

/// ///////////////////////////////////
