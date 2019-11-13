import React                                from 'react';
import { Redirect }                         from 'react-router-dom';
import AnalyticsHelper                      from '../../libs/AnalyticsHelper.js';
import NotificationHelper                   from '../../libs/NotificationHelper.js';
import DeckGenerator, {deckBuilderUpdates}  from '../../libs/DeckGenerator.js';

import {
  Button, 
  Form, 
  Input, 
  Row, 
  Col, 
  Checkbox,
  Spin
} from 'antd';

let deckStructure = 'https://api.sheety.co/6f260fb0-04d8-4732-b8f2-0dc87c295fc0';
const seMasterDeckStructure = 'https://api.sheety.co/6f260fb0-04d8-4732-b8f2-0dc87c295fc0';
const psscMasterDeckStructure = 'https://api.sheety.co/cc2429e6-96ed-4244-890b-e2302b0e3996';

class DeckBuilder extends React.Component {

  /**
   * Constructor
   * @param  {Object} props Properties that are passed into this component by parent
   * @return {null}
   */
  constructor(props) {
    super(props);

    if(props.team == "se"){
      deckStructure = seMasterDeckStructure;
    } else if(props.team == "pssc"){
      deckStructure = psscMasterDeckStructure;
    } else {
      deckStructure = seMasterDeckStructure;
    }
    // Get notification helper instance
    this.notificationHelper = new NotificationHelper();

    // Set state of the form, decks is empty while we wait for the JSON to return with the list of sections.
    this.state = {
      decks:              [],     // The current decks that the user has selected, an empty array while we wait for the JSON to return
      indeterminate:      false,  // For the indeterminate state of the "check all" checkbox
      checkAll:           false,  // Whether all the checkboxes are checked or not
      checkedList:        [],     // The list of checked checkboxes (decks)
      logo:               null,   // The current logo (determined from the customer name)
      generatingMessage:  null,   // The message that should be shown when the deck is generating
      redirect:           false,  // Redirect to the last stage
      shouldNotify:       this.notificationHelper.granted() // Whether the checkbox for "notify" should be checked or not
    };

    // Create an analytics helper
    this.analyticsHelper = new AnalyticsHelper(true);
  }

  componentDidMount() {
    // Fetch the deck sections and lengths from: https://docs.google.com/spreadsheets/d/1lAorVfpa8xeOMuT95lLj_I8YblvzMzy2-TlH1ttkn-A/edit#gid=0
    fetch(deckStructure)
    .then((response) => {
      response.json()
      .then((data) => {
        // Get the decks and prepare them
        let decks = this.prepareDecks(data);

        // Update the state of the form with the new decks
        this.setState({ decks });
      });
    });
  }

  /**
   * Render this component in react
   * @return {React.Component} Renders the entire app
   */
  render() {
    // Redirect if we've finished (to the success page)
    if(this.state.redirect)
      return (
        <Redirect push to={{ 
          pathname: "/success", 
          state: {deckUrl: this.state.deckUrl}
        }} />
      );

    // Redirect if we don't have enough info
    if(!this.props.folder) return <Redirect to="/" />;

    const { getFieldDecorator } = this.props.form;
    const { generatingMessage } = this.state;
    const generating = typeof generatingMessage === "string";

    return (
      <Spin tip={generatingMessage} spinning={generating}>
        <Form hideRequiredMark={true} onSubmit={(e) => this.handleSubmit(e)}>
          <Row gutter={{xs: 0, sm: 32}}>
            <Col xs={24} sm={12} md={10} lg={8}>

              <Row gutter={16}>
                <Col span={18}>
                  <Form.Item label="Customer Name">
                    {getFieldDecorator('customer_name', {
                      rules: [{ required: true, message: 'Please input a customer name!', whitespace: true }]
                    })(<Input onBlur={(e)=>this.handleCompanyNameChange(e)} />)}
                  </Form.Item>
                </Col>
                <Col span={6}>
                  {typeof this.state.logo !== "undefined" && (
                    <img 
                      alt=""
                      src={this.state.logo} 
                      style={{
                        width: '100%'
                      }}
                    />
                  )}
                </Col>
              </Row>

              <Form.Item label="AE Name">
                {getFieldDecorator('ae_name', {
                  rules: [{ required: true, message: 'Please input an AE name!', whitespace: true }]
                })(<Input />)}
              </Form.Item>

              <Form.Item label="SE Name">
                {getFieldDecorator('se_name', {
                  rules: [{ required: true, message: 'Please input an SE name!', whitespace: true }],
                  initialValue: this.props.seName
                })(<Input />)}
              </Form.Item>

              <Form.Item label="Sections">
                <Checkbox
                  indeterminate={this.state.indeterminate}
                  onChange={(e) => this.onCheckAllChange(e)}
                  checked={this.state.checkAll}
                >
                  Check all
                </Checkbox>
                {getFieldDecorator('decks', {
                  rules: [{
                    validator: (rule, value, callback) => {
                      // Check that this is an array and that it has a length
                      if(typeof value === "object" && value.length > 0){
                        callback();
                      }
                      // If it doesn't, return false to the callback
                      else {
                        callback(false);
                      }
                    }, 
                    message: 'Please choose at least one slide template', whitespace: true
                  }]
                })(
                  <Checkbox.Group style={{ width: '100%' }} onChange={(checkedList) => this.onChange(checkedList)}>
                    {this.state.decks.map((value, index) => {
                      return(
                        <Row key={index}>
                          <Col span={24}>
                            <Checkbox value={value.order}>{value.title} ({value.slides} slides)</Checkbox>
                          </Col>
                        </Row>
                      )
                    })}
                  </Checkbox.Group>
                )}
              </Form.Item>

              {!this.notificationHelper.blocked() && (
                <Form.Item label="Notifications">
                  {getFieldDecorator('notify', {
                    valuePropName: 'checked',
                    initialValue: this.state.shouldNotify
                  })(
                    <Checkbox onChange={(e) => this.notifyChange(e)}>Notify me when done</Checkbox>
                  )}
                </Form.Item>
              )}
            </Col>
          </Row>

          <div className="steps-action" style={{marginTop: 25}}>
            <Button htmlType="submit" type="primary">Generate Deck</Button> 
          </div>
        </Form>
      </Spin>
    );
  }

  /**
   * Prepare the list of individual decks for the deckbuilder to handle
   * @param  {array} decks  The array of decks that we will use
   * @return {array}        The fixed/finished array of decks
   */
  prepareDecks(decks) {
    // Lets take the list of decks and add an "offset" to them so we can easily delete them in the future
    let currOffset = 0;
    for(var i = 0; i < decks.length; i++) {
      // Add the current offset into the decks array
      decks[i]["offset"] = currOffset;

      // Add the number of decks to the offset
      currOffset += decks[i].slides;
    }

    return decks;
  }

  /**
   * Handle the user checking/unchecking the "notify" checkbox
   * @param  {object} e Event object (get target with e.target)
   * @return {null}  
   */
  notifyChange(e) {
    // If blocked we shouldn't be able to get here as the element shouldn't be shown
    if(this.notificationHelper.blocked()) {
      this.setState({ shouldNotify: false });
      return;
    }

    let checked = e.target.checked;

    // Check if the user wants notifications but doesn't have them enabled
    if(checked && !this.notificationHelper.granted()) {
      // We need to ask them to enable notifications
      this.notificationHelper.request().then((granted) => {
        // We know the user wants notifications, so it's up to whether they enabled or not
        this.toggleNotifications(granted);
      });  
    }
    else {
      // Either box unchecked (no notifications) or box checked
      // and user has already granted (want notifications)
      // so either way we can use the `checked` variable...
      this.toggleNotifications(checked);
    }
  }

  toggleNotifications(onOff) {
    this.setState({
      shouldNotify: onOff
    });
  }

  /**
   * Handle the user checking a deck checkbox on/off
   * @param  {array} checkedList Array of checkbox values
   * @return {null}
   */
  onChange(checkedList) {
    // Set the state of the component to reflect the checkboxes that have been ticked
    this.setState({
      checkedList,
      indeterminate:  !!checkedList.length && checkedList.length < this.state.decks.length,
      checkAll:       checkedList.length === this.state.decks.length,
    });
  }

  /**
   * Handle someone checking/unchecking the "check all" checkbox
   * @param  {object} e The checkbox event
   * @return {null}   
   */
  onCheckAllChange(e) {
    // Get a list of all the checkbox values we need to tick
    const checkboxes = [];
    this.state.decks.map((value, index) => checkboxes.push(value.order));

    // Set all the checkboxes in the form to either on or off
    this.props.form.setFields({
      decks: {
        value: e.target.checked ? checkboxes : [] // Empty array means all boxes are unchecked
      },
    }); 

    // Set the state of the component
    this.setState({
      checkAll: e.target.checked,
      indeterminate: false,
      checkedList: e.target.checked ? checkboxes : []
    });
  }

  /**
   * Handle the user clicking "generate" or submitting the form
   * @param  {object} e The form submit event
   * @return {null}   
   */
  handleSubmit(e) {
    // Stop the form from actually submitting
    e.preventDefault();
    
    // Validate the form (this returns either an error or the values from the form)
    this.props.form.validateFields((err, values) => {
      // Check that there's no error (the form will handle itself if there's an error)
      if (!err) {
        let deletedDecks = [],
            chosenDecks  = [];

        // Run through the original decks and create new lists for chosen and deleted slides
        for(const deck of this.state.decks) {
          if(values.decks.indexOf(deck.order) < 0) {
            // This slide hasn't been chosen and should be added to deleted array
            deletedDecks.push(deck);
          }
          else {
            // This slide has been chosen so should be added to chosen array
            chosenDecks.push(deck);
          }
        }

        // Add the customer logo to the values array
        values.logo = this.state.logo; 

        // Create the DeckGenerator
        let deckGenerator = new DeckGenerator(
          this.props.googleHelper, 
          (update, info) => this.deckGeneratorUpdate(update, info),
          this.props.folder.id
        );

        // Start the deck generator
        deckGenerator.generate(values, chosenDecks, deletedDecks, this.props.team);
      }
    });
  }

  /**
   * Handle when the company name changes and the field blurs
   * @param  {object} e The event from the blur event
   * @return {null}   
   */
  handleCompanyNameChange(e) {
    // Get the value
    let partial = e.target.value;

    // Create an abort controller array
    if(typeof this.abortControllers_ === "undefined") {
      this.abortControllers_ = [];
    }

    // Lets abort all the earlier abortControllers
    for(const abortController of this.abortControllers_) {
      abortController.abort();
    }

    // Create a new abort controller for this fetch
    let abortController = new AbortController();
    
    // Fetch the autocomplete suggestions
    fetch("https://autocomplete.clearbit.com/v1/companies/suggest?query=" + partial, {
      method: "get",
      signal: abortController.signal
    })
    .then((response) => response.json())
    .then((response) => {
      // Get the first image
      let logo = response[0].logo;

      // Set the state
      this.setState({
        logo: logo
      });
    })
    .catch((err) => {
      console.log("Error", err);
    });

    // Add this abort controller to the array to be aborted if necessary
    this.abortControllers_.push(abortController);
  }

  deckGeneratorUpdate(update, info) {
    switch(update) {
      case deckBuilderUpdates.STARTED:
        this.setState({
          generatingMessage: "Copying master deck to new location"
        });

        this.analyticsHelper.trackState("generate clicked");
      break;

      case deckBuilderUpdates.DECK_SELECTED:
        this.analyticsHelper.track(info.deck);
      break;

      case deckBuilderUpdates.ACCESSING_NEW_DECK:
        this.setState({
          generatingMessage: "Accessing new presentation",
          deckUrl: "https://docs.google.com/presentation/d/" + info.fileId
        });
      break;

      case deckBuilderUpdates.CONFIGURING_SLIDES:
        this.setState({
          generatingMessage: "Configuring slides (this may take a while)"
        });
      break;

      case deckBuilderUpdates.FINISHED:
        this.analyticsHelper.trackState("finished generating");

        // Send notification
        this.notificationHelper.notify(
          "Optimizely Deck Builder",
          "Your deck is ready; click here to open.",
          "https://upload.wikimedia.org/wikipedia/en/thumb/e/e9/Optimizely_Logo.png/220px-Optimizely_Logo.png"
        );

        // Redirect to final stage
        this.setState({
          redirect: true
        });

      default:
        this.setState({
          generatingMessage: null
        });
      break;
    }
  }

}

export default Form.create()(DeckBuilder);
