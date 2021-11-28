import React, { PureComponent } from 'react'
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  I18nManager,
  ScrollView
} from 'react-native'
import { CardStyleInterpolators } from 'react-navigation-stack'
import { getUrl, postHttp } from '../common/WooComFetch'
import { widthPercentageToDP as wp } from 'react-native-responsive-screen'
import { connect } from 'react-redux'
import SyncStorage from 'sync-storage'
import Spinner from 'react-native-loading-spinner-overlay'
import themeStyle from '../common/Theme.style'

class CreateAccount extends PureComponent {
  /// /////////////////////////////////////////////////////////
  static navigationOptions = ({ navigation }) => {
    const headerStyle = navigation.getParam('headerTitle')
    return {
      headerTitle: headerStyle,
      headerTitleAlign: 'center',
      cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      headerRight: () => null,
      gestureEnabled: false,
      drawerLockMode: 'locked-closed',
      headerTintColor: themeStyle.headerTintColor,
      headerStyle: {
        backgroundColor: themeStyle.primary
      },
      headerTitleStyle: {
        fontWeight: Platform.OS === 'android' ? 'bold' : 'normal'
      },
      headerForceInset: { top: 'never', vertical: 'never' }
    }
  }

  /// /////////////////////////////////////////////////////////
  componentDidMount () {
    this.props.navigation.setParams({
      headerTitle: this.props.isLoading.Config.languageJson2[
        'Create an Account'
      ]
    })
  }

  /// //////////////////////////////////////////////////////////
  constructor (props) {
    super(props)
    this.state = {
      firstName: '',
      lastName: '',
      userName: '',
      phoneNumber: '',
      email: '',
      password: '',
      errorMessage: '',
      spinnerTemp: false,
      dOB: '',
      chosenDate: new Date()
    }
  }

  /// ////////////////////////
  getUserData = (data, t) => {
    const customerData = data
    customerData.customers_telephone = data.phone
    customerData.phone = data.phone
    customerData.customers_id = data.id
    customerData.customers_firstname = data.first_name
    customerData.customers_lastname = data.last_name
    customerData.phone = data.phone
    customerData.avatar = data.avatar
    customerData.image_id = data.image_id
    customerData.customers_dob = data.dob
    SyncStorage.set('customerData', customerData)
    if (SyncStorage.get('drawerLogin')) {
      SyncStorage.set('drawerLogin', false)
      t.props.navigation.navigate('SETTINGS')
    } else {
      t.props.navigation.navigate('SettingsScreen')
    }
  }

  /// ///////////////////////////////////////////////////
  createAccount (t) {
    const reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
    if (reg.test(this.state.email) === false) {
      t.setState({ errorMessage: this.props.isLoading.Config.languageJson2['The email address is not valid'] })
      return
    }
    t.setState({ spinnerTemp: true })
    this.signUp(t)
  }

  /// //////////////////////////////////////////
  signUp = async t => {
    this.errorMessage = ''
    const formData = new FormData()
    formData.append('customers_firstname', t.state.firstName)
    formData.append('customers_lastname', t.state.lastName)
    formData.append('email', t.state.email)
    formData.append('password', t.state.password)
    formData.append('display_name', `${t.state.firstName} ${t.state.lastName}`)
    formData.append('customers_telephone', t.state.userName)
    const data = await postHttp(
      getUrl() + '/api/' + 'processregistration',
      formData
    )
    console.log("formData ====>",formData)
    if (data.success === '1') {
      t.setState(
        {
          spinnerTemp: false
        },
        () => this.getUserData(data.data[0], t)
      )
    }
    if (data.success === '0') {
      t.setState({ errorMessage: data.message, spinnerTemp: false })
    }
  }
  /// /////////////////////////////////////

  canBeSubmitted () {
    const { lastName, firstName, userName, email, password } = this.state
    return (
      lastName.length > 0 &&
      firstName.length > 0 &&
      userName.length > 0 &&
      email.length > 0 &&
      password.length > 0
    )
  }

  phoneNumberCheck () {
    const { phoneNumber, userName } = this.state
    const reg = /^(\+601)[0-9]{8,9}$/
    if (reg.test(phoneNumber) !== true) {
      if (phoneNumber.length !== 0) {
        this.state.userName = '+6' + phoneNumber
      }
    }
    else {
      this.state.userName = phoneNumber
    }
    return (
      (userName.length >= 12 || userName.length === 0) && (userName.length === 0 || reg.test(this.state.userName)) === true
    )
  }

  EmailNumberCheck () {
    const { email } = this.state
    const reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+(\s?)+$/
    this.state.email.trim()
    return (
      (email.length === 0) || reg.test(this.state.email) === true
    )
  }

  /// //////
  render () {
    const isEnabled = this.canBeSubmitted()
    return (
      <ScrollView style={{ backgroundColor: themeStyle.backgroundColor }}>
        <View
          style={{
            flex: 1,
            backgroundColor: themeStyle.backgroundColor,

            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
          <Spinner
            visible={this.state.spinnerTemp}
            textStyle={{
              backgroundColor: themeStyle.loadingIndicatorColor,
              color: themeStyle.loadingIndicatorColor
            }}
          />

          <View
            style={{
              flex: 1,
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            <TextInput
              style={{
                marginTop: 20,
                height: 38,
                width: wp('90%'),
                borderColor: '#c1c1c1',
                borderBottomWidth: 1,
                textAlign: I18nManager.isRTL ? 'right' : 'left',
                paddingLeft: 6,
                paddingRight: 6,
                fontSize: themeStyle.mediumSize + 2,
                color: themeStyle.textColor
              }}
              placeholderTextColor={'#c1c1c1'}
              selectionColor='#51688F'
              placeholder={
                this.props.isLoading.Config.languageJson2['First Name']
              }
              onChangeText={firstName =>
                this.setState({ firstName, errorMessage: '' })
              }
              value={this.state.firstName}
            />
            <TextInput
              style={{
                marginTop: 20,
                height: 38,
                width: wp('90%'),
                borderColor: '#c1c1c1',
                borderBottomWidth: 1,
                textAlign: I18nManager.isRTL ? 'right' : 'left',
                paddingLeft: 6,
                paddingRight: 6,
                fontSize: themeStyle.mediumSize + 2,
                color: themeStyle.textColor
              }}
              placeholderTextColor={'#c1c1c1'}
              selectionColor='#51688F'
              placeholder={
                this.props.isLoading.Config.languageJson2['Last Name']
              }
              onChangeText={lastName =>
                this.setState({ lastName, errorMessage: '' })
              }
              value={this.state.lastName}
            />

            <TextInput
              style={{
                marginTop: 20,
                height: 38,
                width: wp('90%'),
                borderColor: this.phoneNumberCheck() ? '#c1c1c1' : themeStyle.removeBtnColor,
                borderBottomWidth: 1,
                textAlign: I18nManager.isRTL ? 'right' : 'left',
                paddingLeft: 6,
                paddingRight: 6,
                fontSize: themeStyle.mediumSize + 2,
                color: themeStyle.textColor
              }}
              placeholderTextColor={'#c1c1c1'}
              dataDetectorTypes={'phoneNumber'}
              keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'number-pad'}
              selectionColor='#51688F'
              placeholder={this.props.isLoading.Config.languageJson2.Mobile}
              onChangeText={phoneNumber =>
                this.setState({ phoneNumber, errorMessage: '' })
              }
              value={this.state.phoneNumber}
            />
            {!this.phoneNumberCheck() ? (
              <Text
                style={{
                  marginTop: 5,
                  color: 'red',
                  fontSize: themeStyle.mediumSize,
                  alignSelf: 'flex-start'
                }}>
                {this.props.isLoading.Config.languageJson2['The phone number is not valid. No dashes or spaces']}
              </Text>
            ) : null}
            <TextInput
              style={{
                marginTop: !this.phoneNumberCheck() ? 0 : 20,
                height: 38,
                width: wp('90%'),
                borderColor: this.EmailNumberCheck() ? '#c1c1c1' : themeStyle.removeBtnColor,
                borderBottomWidth: 1,
                textAlign: I18nManager.isRTL ? 'right' : 'left',
                paddingLeft: 6,
                paddingRight: 6,
                fontSize: themeStyle.mediumSize + 2,
                color: themeStyle.textColor
              }}
              placeholderTextColor={'#c1c1c1'}
              dataDetectorTypes={'address'}
              selectionColor='#51688F'
              placeholder={this.props.isLoading.Config.languageJson2.Email}
              onChangeText={email => this.setState({ email, errorMessage: '' })}
              value={this.state.email}
            />
            {!this.EmailNumberCheck() ? (
              <Text
                style={{
                  marginTop: 5,
                  color: 'red',
                  fontSize: themeStyle.mediumSize,
                  alignSelf: 'flex-start'
                }}>
                {this.props.isLoading.Config.languageJson2['The email address is not valid']}
              </Text>
            ) : null}
            <TextInput
              style={{
                marginTop: !this.EmailNumberCheck() ? 0 : 15,
                height: 38,
                width: wp('90%'),
                borderColor: '#c1c1c1',
                borderBottomWidth: 1,
                textAlign: I18nManager.isRTL ? 'right' : 'left',
                paddingLeft: 6,
                paddingRight: 6,
                fontSize: themeStyle.mediumSize + 2,
                color: themeStyle.textColor
              }}
              placeholderTextColor={'#c1c1c1'}
              secureTextEntry
              selectionColor='#51688F'
              placeholder={this.props.isLoading.Config.languageJson2.Password}
              onChangeText={password =>
                this.setState({ password, errorMessage: '' })
              }
              value={this.state.password}
            />

            {this.state.errorMessage !== '' ? (
              <Text
                style={{
                  marginTop: 15,
                  color:
                    this.state.errorMessage ===
                    'User Created. Login Using your Username & Password'
                      ? 'green'
                      : 'red'
                }}>
                {this.state.errorMessage}
              </Text>
            ) : null}
            <Text
              style={{
                marginTop: 10,
                padding: 5,
                width: wp('90%'),
                fontSize: themeStyle.mediumSize,
                color: themeStyle.textColor
              }}>
              {
                this.props.isLoading.Config.languageJson2[
                  'Creating an account means you\u2019re okay with our'
                ]
              }
              <Text
                onPress={() => {
                  this.props.navigation.navigate('TermAndServiceScreen')
                }}
                style={{ color: '#00F', fontSize: themeStyle.mediumSize }}>
                {` ${this.props.isLoading.Config.languageJson2['Term and Services']}`}
              </Text>
              , {''}
              <Text
                onPress={() => {
                  this.props.navigation.navigate('PrivacyPolicyScreen')
                }}
                style={{ color: '#00F', fontSize: themeStyle.mediumSize }}>
                {` ${this.props.isLoading.Config.languageJson2['Privacy Policy']}`}
              </Text>
              {''} {this.props.isLoading.Config.languageJson2.and} {''}
              <Text
                onPress={() => {
                  this.props.navigation.navigate('RefundPolicy')
                }}
                style={{ color: '#00F', fontSize: themeStyle.mediumSize }}>
                {` ${this.props.isLoading.Config.languageJson2['Refund Policy']}`}
              </Text>
            </Text>
            <TouchableOpacity
              disabled={!isEnabled || !this.phoneNumberCheck() || !this.EmailNumberCheck()}
              onPress={() => this.createAccount(this)}>
              <View
                style={{
                  marginTop: 18,
                  alignItems: 'center',
                  height: 38,
                  width: wp('90%'),
                  backgroundColor: themeStyle.otherBtnsColor,
                  justifyContent: 'center',
                  opacity: (!isEnabled || !this.phoneNumberCheck() || !this.EmailNumberCheck()) ? 0.4 : 0.9
                }}>
                <Text
                  style={{
                    textAlign: 'center',
                    color: themeStyle.otherBtnsText,
                    fontSize: themeStyle.mediumSize,
                    fontWeight: '500'
                  }}>
                  {this.props.isLoading.Config.languageJson2.Register}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    )
  }
}

const mapStateToProps = state => ({
  isLoading: state
})

export default connect(mapStateToProps, null)(CreateAccount)
