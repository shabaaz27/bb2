import React, { Component } from 'react'
import {
  StyleSheet, // CSS-like styles
  View,
  Dimensions,
  Text,
  FlatList,
  Platform,
  Linking,
  TouchableOpacity
} from 'react-native'
import { UIActivityIndicator } from 'react-native-indicators'
import SyncStorage from 'sync-storage'
import { CardStyleInterpolators } from 'react-navigation-stack'
import BottomNav from '../common/BottomNav'
import { NavigationEvents, withNavigation } from 'react-navigation'
import Spinner from 'react-native-loading-spinner-overlay'
import FlatListView from '../common/FlatListView'
import { getUrl, postHttp } from '../common/WooComFetch'

import { Icon } from 'native-base'
import ShoppingCartIcon from '../common/ShoppingCartIcon'
import MenuIcon from '../common/MenuIcon'
import Banner from '../common/Banner'
import { connect } from 'react-redux'
import themeStyle from '../common/Theme.style'

const { width } = Dimensions.get('window')
const pageNumbers = [1]
class Home1 extends Component {
  static navigationOptions = ({ navigation }) => ({
    headerLeft: () => <MenuIcon navigation={navigation} />,
    cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
    headerTitle: themeStyle.homeTitle,
    headerRight: () => <ShoppingCartIcon navigation={navigation} />,
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
  })

  getOneProduct = async value => {
    const formData = new FormData()
    formData.append('language_id', '1')
    formData.append('products_id', value)
    formData.append('currency_code', '1')
    formData.append(
      'currency_code',
      this.props.isLoading.Config.productsArguments.currency
    )
    const json = await postHttp(getUrl() + '/api/' + 'getallproducts', formData)
    this.setState({ SpinnerTemp: false }, () => {
      this.navigate(json.product_data[0])
    })
  }

  handleOpenURL = event => {
    // D
    if (event.url !== '' && event.url !== undefined && event.url !== null) {
      const route = event.url.replace(/.*?:\/\//g, '')
      const id = route.match(/\/([^/]+)\/?$/)[1]
      if (id !== '' && id !== undefined && id !== null) {
        this.setState({ SpinnerTemp: true }, () => {
          this.getOneProduct(id)
        })
      }
    }
  }

  navigate = json => {
    if (json !== '' && json !== undefined && json !== null) {
      Linking.removeEventListener('url', this.handleOpenURL)
      this.props.navigation.navigate('ProductDetails', { objectArray: json })
    }
  }

  componentDidMount () {
    setTimeout(() => {
      this.setState({ activityIndicatorTemp: false })
    }, 1000)
    this.props.navigation.setParams({
      headerTitle: this.props.isLoading.Config.languageJson2.Home
    })
    if (!this.props.isLoading.sharedData.deepTemp) {
      this.props.isLoading.sharedData.deepTemp = true
      if (Platform.OS === 'android') {
        const NativeLinking = require('react-native/Libraries/Linking/NativeLinking')
          .default
        NativeLinking.getInitialURL().then(url => {
          if (url !== '' && url !== undefined && url !== null) {
            const route = url.replace(/.*?:\/\//g, '')
            const id = route.match(/\/([^/]+)\/?$/)[1]
            if (id !== '' && id !== undefined && id !== null) {
              this.setState({ SpinnerTemp: true }, () => {
                this.getOneProduct(id)
              })
            }
          }
        })
      } else {
        Linking.addEventListener('url', this.handleOpenURL)
      }
    }
  }

  static getDerivedStateFromProps (props) {
    return {
      length:
        props.isLoading.cartItems.recentViewedProducts.length !== undefined
          ? props.isLoading.cartItems.recentViewedProducts.length
          : 0
    }
  }

  constructor (props) {
    super(props)
    this.state = {
      scrollEnable: true,
      images: [],
      isLoading: true,
      images2: [],
      jsonObject: [],
      jsonObject2: [],
      temp: 0,
      //hide recently viewed
      //length: this.props.isLoading.cartItems.recentViewedProducts.length,
      length: 0,
      recent: false,
      activityIndicatorTemp: true,
      SpinnerTemp: false
    }
  }

  componentWillUnmount () {
    clearInterval(this.state.activityIndicatorTemp)
    Linking.removeEventListener('url', this.handleOpenURL)
  }

  render () {
    return this.state.activityIndicatorTemp ? (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: themeStyle.backgroundColor
        }}>
        <UIActivityIndicator
          size={27}
          color={themeStyle.loadingIndicatorColor}
        />
      </View>
    ) : (
      <View
        style={{ flex: 1, paddingBottom: SyncStorage.get('bottom') ? 50 : 0 }}>
        {SyncStorage.get('bottom') ? <BottomNav active={0}></BottomNav> : null}
        {this.props.isLoading.Config.appInProduction ? (
          <TouchableOpacity
            style={{
              zIndex: 5,
              position: 'absolute',
              left: 20,
              bottom: 55,
              alignItems: 'center',
              height: 55,
              width: 55,
              borderRadius: 55 / 2,
              alignSelf: 'center',
              justifyContent: 'center',
              backgroundColor: themeStyle.primary,
              elevation: 10
            }}
            onPress={() => {
              this.props.navigation.navigate('DemoScreen')
            }}>

            <Icon
              name={'md-settings'}
              style={{
                color: themeStyle.primaryContrast,
                paddingTop: Platform.OS === 'ios' ? 2 : 0,
                fontSize: 22
              }}
            />

          </TouchableOpacity>
        ) : null}
        <FlatList
          data={pageNumbers}
          showsVerticalScrollIndicator={false}
          showsVerticalScrollIndicator={false}

          windowSize={50}
          initialNumToRender={6}
          removeClippedSubviews={true}
          legacyImplementation={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={10}

          contentContainerStyle={{
            backgroundColor:
              this.props.isLoading.Config.card_style === 11 ||
              this.props.isLoading.Config.card_style === 12 ||
              this.props.isLoading.Config.card_style === 15
                ? themeStyle.backgroundColor
                : themeStyle.backgroundColor
          }}
          keyExtractor={pageNumber => pageNumber.toString()}
          extraData={this.state}
          renderItem={() => (
            <View
              style={
                (styles.container1,
                {
                  backgroundColor:
                    this.props.isLoading.Config.card_style === 11 ||
                    this.props.isLoading.Config.card_style === 12 ||
                    this.props.isLoading.Config.card_style === 15
                      ? themeStyle.backgroundColor
                      : themeStyle.backgroundColor
                })
              }>
              <Spinner visible={this.state.SpinnerTemp} />

              <NavigationEvents
                onDidFocus={() => {
                  this.props.navigation.setParams({
                    headerRight: () => (
                      <ShoppingCartIcon navigation={this.props.navigation} />
                    )
                  })
                  this.setState({})
                }}
              />
              <View>
                <Banner
                  navigation={this.props.navigation}
                  bannerSelect={
                    this.props.isLoading.Config.banner_style
                  }
                />
              </View>
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    backgroundColor:
                      this.props.isLoading.Config.card_style === 11 ||
                      this.props.isLoading.Config.card_style === 12 ||
                      this.props.isLoading.Config.card_style === 15
                        ? themeStyle.backgroundColor
                        : themeStyle.backgroundColor,
                    marginLeft: 10
                  }}>
                  <Icon
                    name={'time'}
                    style={{
                      color: themeStyle.primary,
                      fontSize: 15,
                      paddingTop: 10,
                      padding: 10,
                      paddingLeft: 0,
                      paddingBottom: 4
                    }}
                  />
                  <Text
                    style={{
                      color: themeStyle.primary,
                      fontSize: themeStyle.smallSize + 1,
                      fontWeight: '400',
                      padding: 10,
                      paddingTop: Platform.OS === 'android' ? 8 : 10,
                      paddingLeft: 0,
                      paddingRight: 5,
                      paddingBottom: 2
                    }}>
                    {this.props.isLoading.Config.languageJson2['Flash Sale']}{' '}
                  </Text>
                </View>
                {this.props.isLoading.sharedData.flashSaleProducts !==
                undefined ? (
                    <FlatListView
                      vertical
                      viewButton
                      navigation={this.props.navigation}
                      dataName={'Flash'}
                      tabArray={
                        this.props.isLoading.sharedData.flashSaleProducts !==
                        undefined &&
                      this.props.isLoading.sharedData.flashSaleProducts !== null
                          ? this.props.isLoading.sharedData.flashSaleProducts
                          : []
                      }
                    />
                  ) : (
                    <View
                      style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        alignSelf: 'center',
                        alignContent: 'center'
                      }}>
                      <View
                        style={{
                          flex: 1,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: 40,
                          alignSelf: 'center'
                        }}>
                        <Icon
                          name={'logo-dropbox'}
                          style={{ color: 'gray', fontSize: 80 }}
                        />

                        <Text
                          style={{
                            fontSize: themeStyle.largeSize + 2,
                            color: themeStyle.textColor
                          }}>
                          {
                            this.props.isLoading.Config.languageJson2[
                              'No Products Found'
                            ]
                          }
                        </Text>
                      </View>
                    </View>
                  )}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-start',
                    alignItems: 'center'
                  }}>
                  <Icon
                    name={'albums'}
                    style={{
                      color: themeStyle.primary,
                      fontSize: 14,
                      paddingTop: 10,
                      padding: 10,
                      paddingBottom: 4
                    }}
                  />
                  <Text
                    style={{
                      color: themeStyle.primary,
                      fontSize: themeStyle.smallSize + 1,
                      padding: 10,
                      paddingTop: Platform.OS === 'android' ? 7 : 8,
                      paddingLeft: 0,
                      paddingRight: 0,
                      paddingBottom: 2
                    }}>
                    {this.props.isLoading.Config.languageJson2['Top Seller'] +
                      ' ' +
                      this.props.isLoading.Config.languageJson2.Products}{' '}
                  </Text>
                </View>
                {this.props.isLoading.sharedData.tab1 !== undefined ? (
                  <FlatListView
                    vertical
                    dataName={'Newest'}
                    viewButton
                    navigation={this.props.navigation}
                    tabArray={
                      this.props.isLoading.sharedData.tab1 !== undefined &&
                      this.props.isLoading.sharedData.tab1 !== null
                        ? this.props.isLoading.sharedData.tab1
                        : []
                    }
                  />
                ) : (
                  <View
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                      alignSelf: 'center',
                      alignContent: 'center'
                    }}>
                    <View
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 40,
                        alignSelf: 'center'
                      }}>
                      <Icon
                        name={'logo-dropbox'}
                        style={{ color: 'gray', fontSize: 80 }}
                      />

                      <Text
                        style={{
                          fontSize: themeStyle.largeSize + 2,
                          color: themeStyle.textColor
                        }}>
                        {
                          this.props.isLoading.Config.languageJson2[
                            'No Products Found'
                          ]
                        }
                      </Text>
                    </View>
                  </View>
                )}

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-start',
                    alignItems: 'center'
                  }}>
                  <Icon
                    name={'bookmark'}
                    style={{
                      color: themeStyle.primary,
                      fontSize: 14,
                      paddingTop: 10,
                      padding: 10,
                      paddingBottom: 4
                    }}
                  />
                  <Text
                    style={{
                      color: themeStyle.primary,
                      fontSize: themeStyle.smallSize + 1,
                      padding: 10,
                      paddingTop: Platform.OS === 'android' ? 7 : 8,
                      paddingLeft: 0,
                      paddingRight: 0,
                      paddingBottom: 2
                    }}>
                    {this.props.isLoading.Config.languageJson2.Deals +
                      ' ' +
                      this.props.isLoading.Config.languageJson2.Products}{' '}
                  </Text>
                </View>

                {this.props.isLoading.sharedData.tab2 !== undefined ? (
                  <FlatListView
                    vertical
                    dataName={'Deals'}
                    viewButton
                    navigation={this.props.navigation}
                    tabArray={
                      this.props.isLoading.sharedData.tab2 !== undefined &&
                      this.props.isLoading.sharedData.tab2 !== null
                        ? this.props.isLoading.sharedData.tab2
                        : []
                    }
                  />
                ) : (
                  <View
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                      alignSelf: 'center',
                      alignContent: 'center'
                    }}>
                    <View
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 40,
                        alignSelf: 'center'
                      }}>
                      <Icon
                        name={'logo-dropbox'}
                        style={{ color: 'gray', fontSize: 80 }}
                      />

                      <Text
                        style={{
                          fontSize: themeStyle.largeSize + 2,
                          color: themeStyle.textColor
                        }}>
                        {
                          this.props.isLoading.Config.languageJson2[
                            'No Products Found'
                          ]
                        }
                      </Text>
                    </View>
                  </View>
                )}

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-start',
                    alignItems: 'center'
                  }}>
                  <Icon
                    name={'thumbs-up-sharp'}
                    style={{
                      color: themeStyle.primary,
                      fontSize: 15,
                      paddingTop: 10,
                      padding: 10,
                      paddingBottom: 4,
                      paddingRight: 5
                    }}
                  />
                  <Text
                    style={{
                      color: themeStyle.primary,
                      fontSize: themeStyle.smallSize + 1,
                      padding: 10,
                      paddingTop: Platform.OS === 'android' ? 8 : 8,
                      paddingLeft: 0,
                      paddingRight: 0,
                      paddingBottom: 2
                    }}>
                    {this.props.isLoading.Config.languageJson2['Most Liked'] +
                      ' ' +
                      this.props.isLoading.Config.languageJson2.Products}{' '}
                  </Text>
                </View>
                {this.props.isLoading.sharedData.tab3 !== undefined ? (
                  <FlatListView
                    vertical
                    dataName={'Featured'}
                    viewButton
                    navigation={this.props.navigation}
                    tabArray={
                      this.props.isLoading.sharedData.tab3 !== undefined
                        ? this.props.isLoading.sharedData.tab3
                        : []
                    }
                  />
                ) : (
                  <View
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                      alignSelf: 'center',
                      alignContent: 'center'
                    }}>
                    <View
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 40,
                        alignSelf: 'center'
                      }}>
                      <Icon
                        name={'logo-dropbox'}
                        style={{ color: 'gray', fontSize: 80 }}
                      />

                      <Text
                        style={{
                          fontSize: themeStyle.largeSize + 2,
                          color: themeStyle.textColor
                        }}>
                        {
                          this.props.isLoading.Config.languageJson2[
                            'No Products Found'
                          ]
                        }
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {this.state.length > 0 ? (
                <View>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'flex-start',
                      alignItems: 'center'
                    }}>
                    <Icon
                      name={'list'}
                      style={{
                        color: themeStyle.primary,
                        fontSize: 19,
                        paddingTop: 10,
                        padding: 10,
                        paddingBottom: 4
                      }}
                    />
                    <Text
                      style={{
                        color: themeStyle.primary,
                        fontSize: themeStyle.smallSize + 1,
                        padding: 10,
                        paddingTop: Platform.OS === 'android' ? 8 : 8,
                        paddingLeft: 0,
                        paddingRight: 0,
                        paddingBottom: 2
                      }}>
                      {
                        this.props.isLoading.Config.languageJson2[
                          'Recently Viewed'
                        ]
                      }{' home 1 '}
                    </Text>
                  </View>
                  <FlatListView vertical dataName={'RecentlyViewed'} />
                </View>
              ) : null}
            </View>
          )}
        />
      </View>
    )
  }
}
const mapStateToProps = state => ({
  isLoading: state
})
export default connect(mapStateToProps, null)(withNavigation(Home1))

const styles = StyleSheet.create({
  container1: {
    flex: 1,
    width
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center'
  }
})
