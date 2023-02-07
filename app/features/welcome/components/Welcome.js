// @flow

import Button from '@atlaskit/button';
import { FieldTextStateless } from '@atlaskit/field-text';
import { SpotlightTarget } from '@atlaskit/onboarding';
import Page from '@atlaskit/page';
import { AtlasKitThemeProvider } from '@atlaskit/theme';

import { generateRoomWithoutSeparator } from '@jitsi/js-utils/random';
import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import { compose } from 'redux';
import type { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';

import { Navbar } from '../../navbar';
import { Onboarding, startOnboarding } from '../../onboarding';
import { RecentList } from '../../recent-list';
import { createConferenceObjectFromURL } from '../../utils';

import { Body, FieldWrapper, Form, Header, Label, Wrapper } from '../styled';
import Spinner from '@atlaskit/spinner/dist/cjs/Spinner';
import config from "../../config";
import { toast } from 'react-toastify';
import { GET, setBaseURL } from '../../dhanush/services';
import { SET_MEETING_PARTICIPANT_DETAILS, SET_MEETING_URL } from '../actionTypes';
import image_banner from '../../../images/logo_banner.png';

type Props = {

    /**
     * Redux dispatch.
     */
    dispatch: Dispatch<*>;

    /**
     * React Router location object.
     */
    location: Object;

    /**
     * I18next translate function.
     */
    t: Function;

    /**
     * Meeting URL.
     */
    _meetingUrl: string;
};

type State = {

    /**
     * Timer for animating the room name geneeration.
     */
    animateTimeoutId: ?TimeoutID,

    /**
     * Generated room name.
     */
    generatedRoomname: string,

    /**
     * Current room name placeholder.
     */
    roomPlaceholder: string,

    /**
     * Timer for re-generating a new room name.
     */
    updateTimeoutId: ?TimeoutID,

    /**
     * URL of the room to join.
     * If this is not a url it will be treated as room name for default domain.
     */
    url: string;

    /**
     * URL of the room to join.
     */
    hasJoiningLink: Boolean,

    /**
    * Loding indicator.
    */
    isLoading: Boolean
};

/**
 * Welcome Component.
 */
class Welcome extends Component<Props, State> {
    /**
     * Initializes a new {@code Welcome} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        // Initialize url value in state if passed using location state object.
        let url = '';

        // Check and parse url if exists in location state.
        if (props.location.state) {
            const { room, serverURL } = props.location.state;

            if (room && serverURL) {
                url = `${serverURL}/${room}`;
            }
        }

        this.state = {
            animateTimeoutId: undefined,
            generatedRoomname: '',
            roomPlaceholder: '',
            updateTimeoutId: undefined,
            url,
            hasJoiningLink: false,
            isLoading: false
        };

        // Bind event handlers.
        this._animateRoomnameChanging = this._animateRoomnameChanging.bind(this);
        this._onURLChange = this._onURLChange.bind(this);
        this._onFormSubmit = this._onFormSubmit.bind(this);
        this._onJoin = this._onJoin.bind(this);
        this._updateRoomname = this._updateRoomname.bind(this);
    }

    /**
     * Start Onboarding once component is mounted.
     * Start generating randdom room names.
     *
     * NOTE: It autonatically checks if the onboarding is shown or not.
     *
     * @returns {void}
     */
    componentDidMount() {
        this.props.dispatch(startOnboarding('welcome-page'));

        this._updateRoomname();

        setTimeout(() => this.props._meetingUrl ? this._onJoin() : null, 100);
    }

    /**
     * Stop all timers when unmounting.
     *
     * @returns {voidd}
     */
    componentWillUnmount() {
        this._clearTimeouts();
    }

    /**
     * Renders the home page.
     *
     * @returns {ReactElement}
     */
    _renderHomePage() {
        return (
            <span style={{ display: 'none' }}>
                {this.props._isJoinedUsingMeetLink ? null : window.location.href = config.homePageURL}
            </span>)
    }

    loadingIndicator = () => {
        return <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
        }}>
            <Spinner size='large' />
        </div>
    }

    landingPage = () => {
        return (
            <div className="row" style={{ position: 'relative', top: '35%', justifyContent: 'center', }}>
                <div className="column" onClick={() => this.setState({ hasJoiningLink: !this.state.hasJoiningLink })} style={{ cursor: 'pointer', marginRight: '15%', display: 'block', marginBottom: '20px', float: 'left', width: '25%', padding: '0 10px' }}>
                    <div className="card" style={{ backgroundColor: '#1766a7', borderRadius: '1rem', boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)', padding: '90px 25px', textAlign: 'center' }}>
                        <h2 style={{ color: '#ffffff' }}>Join Using URL</h2>
                    </div>
                </div>
                <div className="column" onClick={() => { this.setState({ isLoading: !this.state.isLoading }), this._renderHomePage() }} style={{ cursor: 'pointer', display: 'block', float: 'left', width: '25%', padding: '0 10px' }}>
                    <div className="card" style={{ backgroundColor: '#f77933', borderRadius: '1rem', boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)', padding: '90px 25px', textAlign: 'center' }}>
                        <h2 style={{ color: '#ffffff' }}>Schedule a Meeting</h2>
                    </div>
                </div>
            </div>
        )
    }

    /**
     * Render function of component.
     *
     * @returns {ReactElement}
     */
    render() {
        const { _meetingUrl, _isJoinedUsingMeetLink } = this.props;

        return (
            <Page>
                {/* <Page navigation = { <Navbar /> }> */}
                <AtlasKitThemeProvider mode='light'>
                    <Wrapper>
                        {this.state.isLoading ? this.loadingIndicator() : (_meetingUrl && _isJoinedUsingMeetLink || this.state.hasJoiningLink) ? this._renderHeader() : this.landingPage()}
                        {/* {this._renderHeader()} */}
                        {/* {this._renderBody()} */}
                        {/* <Onboarding section='welcome-page' /> */}
                    </Wrapper>
                </AtlasKitThemeProvider>
            </Page>
        );
    }

    _animateRoomnameChanging: (string) => void;

    /**
     * Animates the changing of the room name.
     *
     * @param {string} word - The part of room name that should be added to
     * placeholder.
     * @private
     * @returns {void}
     */
    _animateRoomnameChanging(word: string) {
        let animateTimeoutId;
        const roomPlaceholder = this.state.roomPlaceholder + word.slice(0, 1);

        if (word.length > 1) {
            animateTimeoutId
                = setTimeout(
                    () => {
                        this._animateRoomnameChanging(
                            word.substring(1, word.length));
                    },
                    70);
        }
        this.setState({
            animateTimeoutId,
            roomPlaceholder
        });
    }

    /**
     * Method that clears timeouts for animations and updates of room name.
     *
     * @private
     * @returns {void}
     */
    _clearTimeouts() {
        clearTimeout(this.state.animateTimeoutId);
        clearTimeout(this.state.updateTimeoutId);
    }

    _onFormSubmit: (*) => void;

    /**
     * Prevents submission of the form and delegates the join logic.
     *
     * @param {Event} event - Event by which this function is called.
     * @returns {void}
     */
    _onFormSubmit(event: Event) {
        event.preventDefault();
        this._onJoin();
    }

    _onJoin: (*) => void;

    /**
     * Redirect and join conference.
     *
     * @returns {void}
     */
    _onJoin() {
        const { _meetingUrl } = this.props;

        // const inputURL = this.state.url || this.state.generatedRoomname;
        const inputURL = _meetingUrl ? _meetingUrl : this.state.url;

        const meetingURLParams = inputURL.split('/');
        const meetingId = meetingURLParams[meetingURLParams.length - 1];

        if (inputURL.length == 0)
            return toast.info('Please enter the meeting URL');
        else {
            try {
                setBaseURL((new URL(inputURL)).origin);
            } catch (error) {
                toast.error('Invalid URL');
                return;
            }
        }

        GET(meetingId).then(data => {
            (data.status == 'OK') ? this.setMeetingParticipantInfo(data.data.meetingdetails) : toast.error(data.message)
        }).catch((error) => { toast.error(error) });

        // const conference = createConferenceObjectFromURL(inputURL);

        // // Don't navigate if conference couldn't be created
        // if (!conference) {
        //     return;
        // }

        // this.props.dispatch(push('/conference', conference));
    }

    setMeetingParticipantInfo(participantData) {
        const isHost = ["host", "teacher"].includes(participantData.role.toLowerCase());
        const participantInfo = {
            fullName: participantData.fullName,
            meetingID: participantData.meetingID,
            role: participantData.role,
            ErrorFlag: participantData.ErrorFlag,
            ErrorMessage: participantData.ErrorMessage,
            repeatdisplay: participantData.repeatdisplay,
            endTime: participantData.endTime,
            userID: participantData.userID || 0,
            samvaad: "true",
            buttonTitle: isHost ? 'Start The Meeting' : 'Join The Meeting',
            passwordrequired: isHost ? false : (participantData.passwordrequired === "true") || "",
            password: participantData.password || "",
            meetingTitle: participantData.name,
            hostName: participantData.hostName,
            startTime: participantData.StartTime,
            endTime: participantData.EndTime,
            zoneId: participantData.zoneId,
            repeatdisplay: participantData.repeatdisplay,
            startTimeWithTimeZone: participantData.startTimeWithTimeZone,
            endTimeWithTimeZone: participantData.endTimeWithTimeZone,
            domain_URL: participantData.domainUrl,
            emailRequired: participantData.emailRequired || participantData.emailRequiredWithoutValidation,
            isFaceRecognition: participantData.isFaceRecognition || false,
            breakoutRoomsList: participantData.breakoutRoomsList || [],
            isBreakoutRoomsCreated: participantData.isBreakoutRoomsCreated || false,
            isEnabledParticipantAudioControl: participantData.isEnabledParticipantAudioControl || false,
            permissions: participantData.permissionList,
            saveRecordingsLocally: participantData.isSaveRecordingsLocally,
            numberOfModerators: participantData.numberOfModerators
        };
        this.props.dispatch({
            type: SET_MEETING_PARTICIPANT_DETAILS,
            participantData: participantInfo
        })
        !this.props._meetingUrl && this.props.dispatch({
            type: SET_MEETING_URL,
            meetingURL: this.state.url
        })
        this.props.dispatch(push('/details'));
    }

    _onURLChange: (*) => void;

    /**
     * Keeps URL input value and URL in state in sync.
     *
     * @param {SyntheticInputEvent<HTMLInputElement>} event - Event by which
     * this function is called.
     * @returns {void}
     */
    _onURLChange(event: SyntheticInputEvent<HTMLInputElement>) {
        this.setState({
            url: event.currentTarget.value
        });
    }

    /**
     * Renders the body for the welcome page.
     *
     * @returns {ReactElement}
     */
    _renderBody() {
        return (
            <Body>
                <RecentList />
            </Body>
        );
    }

    /**
     * Renders the header for the welcome page.
     *
     * @returns {ReactElement}
     */
    _renderHeader() {
        const locationState = this.props.location.state;
        const locationError = locationState && locationState.error;
        const { t } = this.props;

        return (
            <div>
                <img src={image_banner} style={{ paddingTop: '2%', height: "100px" }} />
                <Header style={{ justifyContent: 'center' }}>
                    <SpotlightTarget name='conference-url'>
                        <Form onSubmit={this._onFormSubmit}>
                            {/* <Label>{t('enterConferenceNameOrUrl')} </Label> */}
                            <Label>Enter Meeting URL</Label>
                            <FieldWrapper>
                                <FieldTextStateless
                                    autoFocus={true}
                                    isInvalid={locationError}
                                    isLabelHidden={true}
                                    onChange={this._onURLChange}
                                    placeholder='Enter Meeting URL'
                                    shouldFitContainer={true}
                                    type='text'
                                    value={this.state.url} />
                                <Button
                                    appearance='primary'
                                    onClick={this._onJoin}
                                    type='button'>
                                    {t('go')}
                                </Button>
                            </FieldWrapper>
                        </Form>
                    </SpotlightTarget>
                </Header>
            </div>
        );
    }

    _updateRoomname: () => void;

    /**
     * Triggers the generation of a new room name and initiates an animation of
     * its changing.
     *
     * @protected
     * @returns {void}
     */
    _updateRoomname() {
        const generatedRoomname = generateRoomWithoutSeparator();
        const roomPlaceholder = '';
        const updateTimeoutId = setTimeout(this._updateRoomname, 10000);

        this._clearTimeouts();
        this.setState(
            {
                generatedRoomname,
                roomPlaceholder,
                updateTimeoutId
            },
            () => this._animateRoomnameChanging(generatedRoomname));
    }
}
/**
 * Maps (parts of) the redux state to the React props.
 *
 * @param {Object} state - The redux state.
 * @returns {Props}
 */
function _mapStateToProps(state: Object) {

    return {
        _meetingUrl: state.welcome.meetingURL,
        _isJoinedUsingMeetLink: state.welcome.isJoinedUsingMeetLink
    };
}

export default compose(connect(_mapStateToProps), withTranslation())(Welcome);
