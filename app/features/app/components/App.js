// @flow

import { AtlasKitThemeProvider } from '@atlaskit/theme';

import React, { Component } from 'react';
import { Route, Switch } from 'react-router';
import { connect } from 'react-redux';
import { ConnectedRouter as Router, push } from 'react-router-redux';

import { Conference } from '../../conference';
import config from '../../config';
import { history } from '../../router';
import { createConferenceObjectFromURL } from '../../utils';
import { SET_JOINED_USING_MEETING_LINK, SET_MEETING_URL, Welcome } from '../../welcome';
import { toast, ToastContainer } from "react-toastify";
import { ADD, setBaseURL } from '../../dhanush/services';
import UserInfo from '../../welcome/components/UserInfo';
import "react-toastify/dist/ReactToastify.css";

/**
 * Main component encapsulating the entire application.
 */
class App extends Component<*> {
    /**
     * Initializes a new {@code App} instance.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        document.title = config.appName;

        this._listenOnProtocolMessages
            = this._listenOnProtocolMessages.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount()}.
     *
     * @returns {void}
     */
    componentDidMount() {
        // start listening on this events
        window.jitsiNodeAPI.ipc.on('protocol-data-msg', this._listenOnProtocolMessages);

        // send notification to main process
        window.jitsiNodeAPI.ipc.send('renderer-ready');

        this._listenOnProtocolMessages('', 'https://dev.samvaad.pro/aar/5d90V-1675753716892_eyJzdGFydFdpdGhWaWRlb011dGVkIjpmYWxzZSwic3RhcnRXaXRoQXVkaW9NdXRlZCI6dHJ1ZX0?V=1675753740897')

    }

    /**
     * Implements React's {@link Component#componentWillUnmount()}.
     *
     * @returns {void}
     */
    componentWillUnmount() {
        // remove listening for this events
        window.jitsiNodeAPI.ipc.removeListener(
            'protocol-data-msg',
            this._listenOnProtocolMessages
        );

        // this._listenOnProtocolMessages('', 'https://dev.samvaad.pro/aar/adgK-1657016844201')
    }

    _listenOnProtocolMessages: (*) => void;

    /**
     * Handler when main proccess contact us.
     *
     * @param {Object} event - Message event.
     * @param {string} inputURL - String with room name.
     *
     * @returns {void}
     */
    _listenOnProtocolMessages(event, inputURL: string) {

        let mediaData = inputURL.includes('_') ? inputURL.split('_')[1].split('?')[0] : inputURL;
        console.log(atob(mediaData), 'mediaData');

        this.props.dispatch({
            type: SET_JOINED_USING_MEETING_LINK,
            isJoinedUsingMeetLink: true,
        });

        // Remove trailing slash if one exists.
        if (inputURL.slice(-1) === '/') {
            inputURL = inputURL.slice(0, -1); // eslint-disable-line no-param-reassign
        }

        //call the add record API to check wether app is opend or not
        if (navigator.platform.startsWith("Mac")) {
            if (inputURL.includes("?")) {
                inputURL = inputURL.split("?")[0];
                if (!inputURL.includes(":")) {
                    inputURL = inputURL.replace("https", "https:");
                }
            } else if (!inputURL.includes(":")) {
                inputURL = inputURL.replace("https", "https:");
            }
        }
        this.checkAppIsOpendOrNot(inputURL);

        // // change route when we are notified
        // this.props.dispatch(push('/conference', conference));
        this.props.dispatch({
            type: SET_MEETING_URL,
            meetingURL: inputURL,
        });
        this.props.dispatch(push("/"));

        // if (participantName.toLowerCase() == "me")
        //     setParticipantNameError("This is not a valid User Name");

        // const conference = createConferenceObjectFromURL(inputURL);

        // // Don't navigate if conference couldn't be created
        // if (!conference) {
        //     return;
        // }

        // // change route when we are notified
        // this.props.dispatch(push('/conference', conference));
    }

    checkAppIsOpendOrNot = (inputURL) => {
        //call the add record API to check wether app is opend or not
        const newURL = new URL(inputURL);
        setBaseURL(newURL.origin);
        const meetingURLParams = new URLSearchParams(newURL.search);
        const meetingID = newURL.pathname.split("-")[1];
        if (meetingURLParams.has("V")) {
            const timeStamp = meetingURLParams.get("V");
            ADD(meetingID, timeStamp)
                .then((data) => {
                    console.log(data, "data");
                })
                .catch((error) => {
                    toast.error(error);
                });
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <AtlasKitThemeProvider mode='dark'>
                <Router history={history}>
                    <Switch>
                        <Route component={Welcome} exact={true} path='/' />
                        <Route component={Conference} path='/conference' />
                        <Route component={UserInfo} path="/details" />
                    </Switch>
                </Router>
                <ToastContainer closeOnClick pauseOnHover />
            </AtlasKitThemeProvider>
        );
    }
}

export default connect()(App);
