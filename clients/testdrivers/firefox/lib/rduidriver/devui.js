/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at:
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla Raindrop Code.
 *
 * The Initial Developer of the Original Code is
 *   The Mozilla Foundation
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Andrew Sutherland <asutherland@asutherland.org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

/**
 * Helper logic to drive the deuxdrop Development UI using WebDriver and verify
 *  the correct things are displayed.  This is intended to be invoked by higher
 *  level tests using the moda system state representation in order to be able
 *  to know what should be displayed by the UI.
 **/

define(
  [
    'q',
    'rdcommon/log',
    'module',
    'exports'
  ],
  function(
    $Q,
    $log,
    $module,
    exports
  ) {
const when = $Q.when;

/**
 * Derive the wmsy CSS class name for the given element.
 */
function dwc(domain, moduleId, widgetName, elemName) {
  return domain + '--' + moduleId + '--' + widgetName + '--' + elemName;
}

const
  // tab framework
  clsTabHeaderRoot = dwc('tabs', 'tabs', 'tab-header', 'root'),
  clsTabHeaderLabel = dwc('tabs', 'tabs', 'tab-header', 'label'),
  clsTabHeaderClose = dwc('tabs', 'tabs', 'tab-header', 'close'),
  // (although tabs are their own widget types, they still get branded with the
  //  -item directive of their containing widget.  woo!)
  clsTabPanels = dwc('tabs', 'tabs', 'tabbox', 'panels-item'),
  // specific tab widget roots
  clsTabHome = dwc('tabs', 'tab-home', 'home-tab', 'root'),
  // signup tab
  clsSignupOtherServer = dwc('tabs', 'tab-signup', 'signup-tab', 'otherServer'),
  clsSignupSignup = dwc('tabs', 'tab-signup', 'signup-tab', 'btnSignup'),
  // home tab buttons
  clsHomeMakeFriends = dwc('tabs', 'tab-home', 'home-tab', 'btnMakeFriends'),
  clsHomeFriendRequests = dwc('tabs', 'tab-home', 'home-tab',
                              'btnFriendRequests'),
  clsHomeListFriends = dwc('tabs', 'tab-home', 'home-tab', 'btnListFriends'),
  clsHomeCompose = dwc('tabs', 'tab-home', 'home-tab', 'btnCompose'),
  // connection requests
  clsConnReqRoot = dwc('moda', 'tab-common', 'conn-request', 'root'),
  clsConnReqName = dwc('moda', 'tab-common', 'conn-request', 'peep'),
  clsConnReqMessage = dwc('moda', 'tab-common', 'conn-request', 'messageText'),
  clsAcceptConnAccept = dwc('tabs', 'tab-common', 'accept-request-tab',
                            'btnAccept'),
  clsAuthorConnSend = dwc('tabs', 'tab-common', 'author-contact-request-tab',
                          'btnSend'),
  // peeps
  clsPeepBlurb = dwc('moda', 'tab-common', 'peep-blurb', 'root'),
  clsPeepBlurbName = dwc('moda', 'tab-common', 'peep-blurb', 'name'),
  clsPeepInlineRoot = dwc('moda', 'tab-common', 'peep-inline', 'root'),
  clsPeepInlineName = dwc('moda', 'tab-common', 'peep-inline', 'name'),
  // poco editing
  clsPocoEditName = dwc('moda', 'tab-signup', 'poco-editor', 'displayName'),
  // conversations
  clsConvBlurb = dwc('moda', 'tab-common', 'conv-blurb', 'root'),
  clsConvBlurbText = dwc('moda', 'tab-common', 'conv-blurb',
                         'firstMessageText'),
  // single conversation
  clsConvReplyText = dwc('tabs', 'tab-common', 'conversation-tab',
                         'newMessageText'),
  clsConvReplySend = dwc('tabs', 'tab-common', 'conversation-tab', 'btnSend'),
  clsMsgHuman = dwc('moda', 'tab-common', 'human-message', 'root'),
  clsMsgHumanText = dwc('moda', 'tab-common', 'text'),

  // compose
  clsComposePeepsList = dwc('moda', 'tab-common', 'conv-compose', 'peeps'),
  clsComposeAddPeep = dwc('moda', 'tab-common', 'conv-compose', 'btnAddPeep'),
  clsComposeText = dwc('moda', 'tab-common', 'conv-compose', 'messageText'),
  clsComposeSend = dwc('tabs', 'tab-common', 'conv-compose-tab', 'btnSend'),
  clsPeepPopPeeps = dwc('moda', 'tab-common', 'peep-selector-popup', 'peeps'),

  blah;

const UI_URL = 'about:dddev';

/**
 * `frobElements` grabData definition for our retrieval of the tabbed UI's
 *  state.
 */
const TABFROB_DEF = [
  {
    roots: clsTabHeaderRoot,
    data: [
      [clsTabHeaderLabel, 'text'],
      [null, 'jsprop', 'binding', 'obj', 'kind'],
      [null, 'attr', 'selected'],
      [null, 'attr', 'wantsAttention'],
      [clsTabHeaderClose, 'node'],
    ],
  },
  {
    roots: clsTabPanels,
    data: [],
  }
];
const TF_node = 0, TF_label = 1, TF_kind = 2, TF_selected = 3, TF_attention = 4,
      TF_close = 5;

const MODA_INITIAL_STARTUP_CHECK =
  'var callback = arguments[arguments.length - 1]; ' +
  'if (document.hasOwnProperty("__moda") && ' +
      'document.__moda._ourUser !== null) {' +
  ' callback(); ' +
  '} else {' +
  ' document.__modaEventTestThunk = function(eventType) {' +
  '  if (eventType === "whoAmI") callback(); };' +
  '}';

const MODA_CONNECT_WAIT =
  'var callback = arguments[arguments.length - 1]; ' +
  'document.__modaEventTestThunk = function(eventType, payload) {' +
  ' if (eventType === "connectionStatus" && payload.status === "connected")' +
  '  callback(); };' +
  'document.__moda.connect();';

/**
 * Tab-wise, our approach is that:
 * - We always leave the root tab around as our means of getting at
 *    functionality.
 * - We always have one active 'page' at any given time, and we keep it alive
 *    until we explicitly move to a new page (or back to the root).
 *
 * The bits of our test where we are waiting for something to happen use an
 *  event-driven notification mechanism supported by moda and found in
 *  `modality.js`.  Because the tester and the moda client daemon both
 *  operate asynchronously from the UI content page and we currently issue the
 *  calls to generate the event before we generate our wait, there is an
 *  inherent race between our command to wait and the completion of the thing
 *  we are waiting for.  (If we issued our waits before we triggered the event,
 *  this would not be a concern, but that's a whole additional set of round
 *  trips we don't need.)  To this end, once we activate moda's test
 *  functionality,
 *
 *
 * @args[
 *   @param[webdriver WebDriver]{
 *     The webdriver instance to use; we are responsible for opening the UI's
 *     tab.
 *   }
 * ]
 */
function DevUIDriver(RT, T, client, wdloggest, _logger) {
  this.RT = RT;
  this.T = T;

  this._d = wdloggest;

  /**
   * Kinda-sorta static active tab.  In practice, most of the invocations that
   *  set and check this value are invoked inside of test steps, but because of
   *  the asynchronous nature of the selenium actions, the truely active tab
   *  won't change immediately, so we need something to track the intended
   *  change that will happen.
   */
  this._staticActiveTab = null;
  this._staticActiveTabPayload = null;

  this._dynActiveTab = null;
  this._currentTabFrob = [];
  this._currentTabKinds = [];
  this._currentTabData = {};

  this._peepBlurbData = {};
  this._connReqData = {};
  this._convBlurbDataByFirstMessage = {};

  this._actor = T.actor('devUIDriver', client.__name, null, this);
  this._log = LOGFAB.devUIDriver(this, _logger, client.__name);
  this._actor.__attachToLogger(this._log);

  this._eMakeFriendsBtn = this._eShowPeepsBtn =
    this._eShowConnectRequestsBtn = this._eComposeBtn = null;

  this._lastSeenModaEventNum = 0;
}
exports.DevUIDriver = DevUIDriver;
DevUIDriver.prototype = {
  /**
   * Code to remotely execute to hook us into moda enough to generate limited
   *  awareness of messages from the client daemon to the moda UI.  The really
   *  nice thing about this hookup is that it can run before any moda code has
   *  loaded and it will be okay.
   */
  _rjs_bindModaTestHelper: function() {
    var lastEventNum = 0,
        eventLastHappenedMap = {},
        activeWaitEvent = null,
        activeWaitCallback = null,
        timeBase = Date.now();
    window.LOGGY = [];
    window.__modaCallAfterEvent = function(eventName, fromEventNum, callback) {
      if (eventLastHappenedMap.hasOwnProperty(eventName)) {
        if (eventLastHappenedMap[eventName] > fromEventNum) {
          window.LOGGY.push(["!! firing on", eventName, fromEventNum,
                             Date.now() - timeBase]);
          callback(lastEventNum);
          return;
        }
      }

      activeWaitEvent = eventName;
      activeWaitCallback = callback;
      window.LOGGY.push([":: waiting for", eventName, fromEventNum,
                         Date.now() - timeBase]);
    };

    window.addEventListener('moda-daemon-to-ui', function (evt) {
      var data = JSON.parse(evt.data);

      eventLastHappenedMap[data.type] = ++lastEventNum;

      if (data.type === activeWaitEvent) {
        window.LOGGY.push([":! waited and got", data.type, lastEventNum,
                           Date.now() - timeBase]);
        activeWaitCallback();
        activeWaitEvent = null;
        activeWaitCallback = null;
      }
      window.LOGGY.push(["track", data.type, lastEventNum,
                         Date.now() - timeBase]);

      // -- WebDriver UI tester support
      // To be event driven about changes to the UI, we provide for the
      //  UI tester to be able to know when moda has heard something new and
      //  processed it.
      if (document.__modaEventTestThunk)
        document.__modaEventTestThunk(data.type, data);
    });
  },

  /**
   * Start up the user interface, returning a promise that provides the identity
   *  data from the client.
   *
   * @return[@promise[@dict[
   *   @key[selfIdentBlob]
   *   @key[clientPublicKey]
   * ]]]
   */
  startUI: function() {
    this._d.navigate(UI_URL);

    this._d.remoteExec(this._rjs_bindModaTestHelper, 'bindModaTestHelper');

    this._d.waitForRemoteCallback(MODA_INITIAL_STARTUP_CHECK, [], 'startupCheck');
    this._checkTabDelta({signup: 1, errors: "signup"}, "signup");

    return this._d.stealJSData('identity info', {
      selfIdentBlob: ['document', '__moda', '_ourUser', 'selfIdentBlob'],
      clientPublicKey: ['document', '__moda', '_ourUser', 'clientPublicKey'],
    });
  },

  //////////////////////////////////////////////////////////////////////////////
  // Helpers

  _waitForModa: function(expectedEvent) {
    var self = this;
    when(this._d.waitForRemoteCallback(
           '__modaCallAfterEvent(arguments[0], arguments[1], arguments[2]);',
           [expectedEvent, this._lastSeenModaEventNum],
           expectedEvent),
      function(modaEventNum) {
        self._lastSeenModaEventNum = modaEventNum;
      });
  },

  /**
   * Retrieve the current set of tabs and check it against our previous known
   *  state and the expected set of changes to that state.
   */
  _checkTabDelta: function(tabDelta, currentTab) {
    var self = this, deltaRep = {preAnno: {}, state: {}, postAnno: {}};

    // - mark removed tabs, apply expected deltas
    var idxTab, tabKind, tabKinds = this._currentTabKinds.concat();
    for (tabKind in tabDelta) {
      var change = tabDelta[tabKind];
      // tab closed
      if (change === -1) {
        deltaRep.preAnno[tabKind] = -1;
        idxTab = tabKinds.indexOf(tabKind);
        tabKinds.splice(idxTab, 1);
      }
      // tab added
      else {
        deltaRep.postAnno[tabKind] = 1;
        // insert at the beggining
        if (change === null) {
          tabKinds.splice(0, 0, tabKind);
        }
        // insert after existing tab kind...
        else {
          idxTab = tabKinds.indexOf(change);
          tabKinds.splice(idxTab + 1, 0, tabKind);
        }
      }
    }

    // - generate new tab state, expectation
    for (idxTab = 0; idxTab < tabKinds.length; idxTab++) {
      tabKind = tabKinds[idxTab];
      deltaRep.state[tabKind] = idxTab;
    }
    this.RT.reportActiveActorThisStep(this._actor);
    this._actor.expect_tabState(deltaRep, currentTab);

    when(
      this._d.frobElements(null, TABFROB_DEF),
      function(frobbed) {
        var actualCurrentTab = null,
            oldTabKinds = self._currentTabKinds, newTabData = {},
            deltaRep = { preAnno: {}, state: {}, postAnno: {} },
            realTabKinds = [],
            tabHeaders = frobbed[0], tabBodies = frobbed[1];
        for (var iTab = 0; iTab < tabHeaders.length; iTab++) {
          var tabMeta = tabHeaders[iTab],
              tabKind = tabMeta[TF_kind];
          if (tabMeta[TF_selected])
            actualCurrentTab = self._dynActiveTab = tabKind;
          realTabKinds.push(tabKind);
          newTabData[tabKind] = {
            headerNode: tabMeta[TF_node],
            closeNode: tabMeta[TF_close],
            tabNode: tabBodies[iTab][0],
          };
          deltaRep.state[tabKind] = iTab;
          if (oldTabKinds.indexOf(tabKind) === -1)
            deltaRep.postAnno[tabKind] = 1;
        }
        for (iTab = 0; iTab < oldTabKinds.length; iTab++) {
          tabKind = oldTabKinds[iTab];
          if (realTabKinds.indexOf(tabKind) === -1)
            deltaRep.preAnno[tabKind] = -1;
        }

        self._currentTabData = newTabData;
        self._currentTabKinds = realTabKinds;

        self._log.tabState(deltaRep, actualCurrentTab);
      });

    // Update our expected quasi-static active tab.
    this._staticActiveTab = currentTab;
  },

  /**
   * Explicitly switch tabs, leaving the tab we were on around.
   *
   * XXX speculative
   */
  _switchTab: function(tabKind) {
    this._d.click(this._currentTabData[tabKind].headerNode);
  },

  /**
   * Explicitly close a tab by clicking its close button.
   *
   * Does nothing screenshot-wise, as we do not expect this to be interesting.
   */
  _closeTab: function(tabKind) {
    if (tabKind === undefined)
      tabKind = this._staticActiveTab;
    this._d.click(this._currentTabData[tabKind].closeNode);
  },

  /**
   * Kill the current tab, open a tab by clicking a button on the home page,
   *  wait for that page's query to complete, then make sure the new tab of
   *  the right type showed up and is active.
   */
  _nukeTabSpawnNewViaHomeTab: function(btnElement, tabName) {
    var tabDelta = {};
    // go to the root tab via close
    if (this._staticActiveTab !== 'home') {
      this._closeTab();
      tabDelta[this._dynActiveTab] = -1;
    }
    // hit the button to spawn the new tab
    this._d.click(btnElement);
    // wait for the tab to populate
    this._waitForModa('query');
    // check the tab is there, etc.
    tabDelta[tabName] = 'home';
    this._checkTabDelta(tabDelta, tabName);
  },

  _verifyPeepBlurbsOnTab: function(tabKind, otherClients) {
    var self = this;
    // - expectation
    var expectedNames = {};
    for (var iClient = 0; iClient < otherClients.length; iClient++) {
      expectedNames[otherClients[iClient].__name] = null;
    }
    this.RT.reportActiveActorThisStep(this._actor);
    this._actor.expect_visiblePeeps(expectedNames);

    // - grab
    when(
      this._d.frobElements(
        this._currentTabData[tabKind].tabNode,
        {
          roots: clsPeepBlurb,
          data: [
            [clsPeepBlurbName, 'text'],
          ]
        }),
      function gotFrobbedPeepData(results) {
        var actualNames = {},
            allPeepBlurbData = self._peepBlurbData = {};
        for (var iPeep = 0; iPeep < results.length; iPeep++) {
          var peepData = results[iPeep],
              peepName = peepData[1];
          actualNames[peepName] = null;
          allPeepBlurbData[peepName] = peepData;
        }
        self._log.visiblePeeps(actualNames);
      }
    );
  },

  //////////////////////////////////////////////////////////////////////////////
  // Hacky magic moda things

  /**
   * Force us to connect to the server by marshaling JS code to call the moda
   *  connect function and waiting for the status to change.
   */
  act_connect: function() {
    this._d.waitForRemoteCallback(MODA_CONNECT_WAIT, [], "Moda.connect()");
  },

  //////////////////////////////////////////////////////////////////////////////
  // Signup Mode

  act_signup: function(server, usingName) {
    var eSignupTab = this._currentTabData['signup'].tabNode;

    // - name ourselves
    this._d.typeInTextBox({ className: clsPocoEditName },
                          usingName,
                          eSignupTab);

    // - select the server to use
    var domainNameWithPort = server.__url.slice(5, -1);
    this._d.click({ className: clsSignupOtherServer }, eSignupTab);
    this._d.typeInTextBox({ className: clsSignupOtherServer },
                          domainNameWithPort,
                          eSignupTab);

    // - trigger signup
    this._d.click({ className: clsSignupSignup }, eSignupTab);
    // - wait for signup to complete
    this._waitForModa('signupResult');
    // the signup tab should have gone away...
    // the signed-up tab should have shown up in the background...
    // the home tab should have shown up, focused
    this._checkTabDelta({ "signed-up": 'signup', home: 'signed-up',
                          signup: -1 },
                        'home');

    this._hookupHomeTab();

    // get _ourUser updated...
    this._d.remoteExec('document.__moda.whoAmI();', 'whoAmI()');
    this._waitForModa('whoAmI');

    // steal its updated value
    return this._d.stealJSData('identity info', {
      selfIdentBlob: ['document', '__moda', '_ourUser', 'selfIdentBlob'],
      clientPublicKey: ['document', '__moda', '_ourUser', 'clientPublicKey'],
    });
  },

  //////////////////////////////////////////////////////////////////////////////
  // Steady-state usage

  _hookupHomeTab: function() {
    var self = this;
    when(
      // _currentTabData is not actually populated with the home tab at this
      //  point, so just do a top-level search for the tab rather than trying
      //  to use the tabNode.
      this._d.frobElements(null, {
        roots: clsTabHome,
        data: [
          [clsHomeMakeFriends, 'node'],
          [clsHomeFriendRequests, 'node'],
          [clsHomeListFriends, 'node'],
          [clsHomeCompose, 'node']
        ]
      }),
      function(results) {
        var homeTabData = results[0];
        self._eMakeFriendsBtn = homeTabData[1];
        self._eShowConnectRequestsBtn = homeTabData[2];
        self._eShowPeepsBtn = homeTabData[3];
        self._eComposeBtn = homeTabData[4];
      });
  },

  canSee_possibleFriends: function() {
    return this._staticActiveTab === 'make-friends';
  },

  showPage_possibleFriends: function() {
    this._nukeTabSpawnNewViaHomeTab(this._eMakeFriendsBtn, 'make-friends');
  },

  verify_possibleFriends: function(otherClients, waitForUpdate) {
    if (waitForUpdate)
      this._waitForModa('query');

    this._verifyPeepBlurbsOnTab('make-friends', otherClients);
  },

  act_beginIssuingConnectRequest: function(otherClient) {
    // (we assume that a verify was issued on the listed peeps already)

    // click on the peep blurb
    this._d.click(this._peepBlurbData[otherClient.__name][0]);

    // tab comes up
    this._checkTabDelta({ 'author-contact-request': 'make-friends' },
                        'author-contact-request');
  },
  act_finishIssuingConnectRequest: function(otherClient) {
    // click the send request
    this._d.click({ className: clsAuthorConnSend },
                  this._currentTabData['author-contact-request'].tabNode);

    // tab goes away
    this._checkTabDelta({ 'author-contact-request': -1 },
                        'make-friends');
  },

  showPage_peeps: function() {
    this._nukeTabSpawnNewViaHomeTab(this._eShowPeepsBtn, 'peeps');
  },

  canSee_peeps: function() {
    return this._staticActiveTab === 'peeps';
  },

  /**
   * Verify all provided clients are present *in no particular order*.
   */
  verify_peeps: function(otherClients, waitForUpdate) {
    if (waitForUpdate)
      this._waitForModa('query');

    this._verifyPeepBlurbsOnTab('peeps', otherClients);
  },

  showPage_connectRequests: function() {
    this._nukeTabSpawnNewViaHomeTab(this._eShowConnectRequestsBtn, 'requests');
  },

  canSee_connectRequests: function() {
    return this._staticActiveTab === 'requests';
  },

  /**
   * Verify all connection requests are present *in no particular order*.
   */
  verify_connectRequests: function(connReqInfos, waitForUpdate) {
    if (waitForUpdate)
      this._waitForModa('query');

    var self = this;
    // - expectation
    var expectedNamesAndMessages = {};
    for (var iReq = 0; iReq < connReqInfos.length; iReq++) {
      var connReqInfo = connReqInfos[iReq];
      expectedNamesAndMessages[connReqInfo.testClient.__name] =
        connReqInfo.messageText;
    }
    this.RT.reportActiveActorThisStep(this._actor);
    this._actor.expect_visibleConnReqs(expectedNamesAndMessages);

    // - actual
    when(
      this._d.frobElements(
        this._currentTabData['requests'].tabNode,
        {
          roots: clsConnReqRoot,
          data: [
            [clsConnReqName, 'text'],
            [clsConnReqMessage, 'text'],
          ]
        }
      ),
      function(results) {
        var actualNamesAndMesages = {},
            allConnReqData = self._connReqData = {};
        for (var iReq = 0; iReq < results.length; iReq++) {
          var requesterName = results[iReq][1],
              requestMessage = results[iReq][2];
          actualNamesAndMesages[requesterName] = requestMessage;
          allConnReqData[requesterName] = results[iReq];
        }
        self._log.visibleConnReqs(actualNamesAndMesages);
      });
  },

  act_beginApprovingConnectRequest: function(otherClient) {
    // (we assume that a verify was issued on the conn reqs already)

    // click on the connection request
    this._d.click(this._connReqData[otherClient.__name][0]);

    // this should pop up a new tab with details immediately (no queries)
    this._checkTabDelta({ 'accept-request': 'requests' },
                        'accept-request');
  },

  act_finishApprovingConnectRequest: function(otherClient) {
    // confirm the connection
    this._d.click({ className: clsAcceptConnAccept },
                  this._currentTabData['accept-request'].tabNode);

    // tab goes away!
    this._checkTabDelta({ 'accept-request': -1 },
                        'requests');
  },


  showPage_peepConversations: function(otherClient) {
    // (we assume that we are already on the 'peeps' tab/list)

    // click on the peep blurb
    this._d.click(this._peepBlurbData[otherClient.__name][0]);

    // the conversations tab should come up and populate
    this._waitForModa('query');

    // kill the peeps tab
    this._closeTab('peeps');

    // verify tab status
    this._checkTabDelta({ 'conv-blurbs': 'peeps', peeps: -1 },
                        'conv-blurbs');
  },

  /**
   * Verify all conversations are present *in no particular order*.
   */
  verify_conversations: function(convInfos, waitForUpdate) {
    if (waitForUpdate)
      this._waitForModa('query');

    var self = this, expectedFirstMessages = {};
    // - expectation
    for (var iConv = 0; iConv < convInfos.length; iConv++) {
      var convInfo = convInfos[iConv], tConv = convInfo.tConv;
      expectedFirstMessages[tConvs[iConv].data.firstMessage.data.text] = null;
    }
    this.RT.reportActiveActorThisStep(this._actor);
    this._actor.expect_visibleConvs(expectedFirstMessages);

    // - actual
    when(
      this._d.frobElements(
        this._currentTabData['conv-blurbs'].tabNode,
        {
          roots: clsConvBlurb,
          data: [
            [clsConvBlurbText, 'text'],
          ]
        }
      ),
      function(results) {
        var actualFirstMessages = {},
            blurbData = self._convBlurbDataByFirstMessage = {};
        for (var iConv = 0; iConv < results.length; iConv++) {
          var firstMessageText = results[iConv][1];
          actualFirstMessages[firstMessageText] = null;
          blurbData[firstMessageText] = results[iConv][0];
        }
        self._log.visibleConvs(actualFirstMessages);
      });
  },

  canSee_conversation: function(convInfo) {
    return this._staticActiveTab === 'conversation' &&
           this._staticActiveTabPayload === convInfo;
  },

  act_showConversation: function(convInfo) {
    // (we assume that we are already on a page listing conversations and
    //  that verify_conversations has been invoked).

    var firstMessageText = convInfo.tConv.firstMessage.text;
    // click on the conversation
    this._d.click(this._convBlurbDataByFirstMessage[firstMessageText]);
    // wait for the query to populate
    this._waitForModa('query');
    // kill the conv blurbs tab (only one open thing at a time)
    this._closeTab('conv-blurbs');
    // verify tab state
    this._checkTabDelta({ conversation: 'conv-blurbs', 'conv-blurbs': -1 },
                        'conversation');
    this._staticActiveTabPayload = convInfo;
  },

  /**
   * Verify that the display of a single conversation is correct, checking
   *  against the client-local moda state estimation because a tConv rep does
   *  not know what a client should and should not have received.
   */
  verify_singleConversation: function(convInfo, waitForUpdate) {
    if (waitForUpdate)
      this._waitForModa('query');

    // nb: we only pay attention to the 'human' messages right now and ignore
    //  the join messages.
    // XXX deal with the join messages too
    var expectedMessages = [], backlog = convInfo.tConv.data.convInfo,
        self = this;
    for (var iMsg = 0; iMsg <= convInfo.highestMsgSeen; iMsg++) {
      var msgData = backlog[iMsg].data;
      if (msgData.type === 'message') {
        expectedMessages.push({
          author: msgData.author.__name,
          text: msgData.text
        });
      }
    }
    this.RT.reportActiveActorThisStep(this._actor);
    this._actor.expect_visibleMsgs(expectedMessages);

    when(
      this._d.frobElements(
        this._currentTabData['conversation'].tabNode,
        {
          roots: clsMsgHuman,
          data: [
            [clsPeepInlineName, 'text'],
            [clsMsgHumanText, 'text'],
          ],
        }),
      function(results) {
        var actualMessages = [];
        for (var iUiMsg = 0; iUiMsg < results.length; iUiMsg++) {
          var uiMsg = results[iUiMsg];
          actualMessages.push({
            author: uiMsg[1],
            text: uiMsg[2],
          });
        }
        self._log.visibleMsgs(actualMessages);
      });
  },

  act_replyToConversation: function(messageText) {
    this._d.typeInTextBox({ className: clsConvReplyText },
                          messageText,
                          this._currentTabData['conversation'].tabNode);
    this._d.send({ className: clsConvReplySend },
                 this._currentTabData['converation']);
  },

  act_inviteToConversation: function() {
    // XXX implement in GUI, then implement here...
  },

  showPage_compose: function() {
    // hit the create a conversation button
    this._nukeTabSpawnNewViaHomeTab(this._eComposeBtn, 'conv-compose');
  },

  /**
   * Create a conversation from the home tab.  The alternative would be to
   *  create a conversation from a peep conversation list where we automatically
   *  add that peep to the list of invited peeps.
   */
  act_createConversation: function(recipClients, messageText) {
    // (We assume/require the compose page is already up as part of a separate
    //  test step.  If we did it in here, it would be in the same step, and then
    //  our tabNode reference below would break.  This is sortof a hack, but
    //  I'm declaring it acceptable.)
    var self = this;

    var numPeepsLeftToAdd = recipClients.length;
    this._d.asyncEventsAreComingDoNotResolve();

    // - add the peep(s)
    function findAndClickPeepInPopup(client) {
      when(
        self._d.frobElements(
          clsPeepPopPeeps,
          {
            roots: clsPeepBlurb,
            data: [
              [clsPeepBlurbName, 'text'],
            ],
          }),
        function(frobbed) {
          for (var iPeep = 0; iPeep < frobbed.length; iPeep++) {
            if (frobbed[iPeep][1] === client.__name) {
              self._d.click(frobbed[iPeep][0]);
              verifyPeepInComposeList(client);
              return;
            }
          }
        });
    }

    function verifyPeepInComposeList(client) {
      when(
        self._d.frobElements(
          [self._currentTabData['conv-compose'].tabNode, clsComposePeepsList],
          {
            roots: clsPeepInlineRoot,
            data: [
              [clsPeepInlineName, 'text'],
            ],
          }),
        function(frobbed) {
          for (var iPeep = 0; iPeep < frobbed.length; iPeep++) {
            if (frobbed[iPeep][1] === client.__name) {
              if (--numPeepsLeftToAdd === 0)
                whenAllPeepsAdded();
              return;
            }
          }
          self._log.peepNotAdded(client.__name);
        });
    }

    for (var iRecip = 0; iRecip < recipClients.length; iRecip++) {
      var recip = recipClients[iRecip];
      // hit add to show the popup of people we can add
      this._d.click({ className: clsComposeAddPeep });
      // click the peep
      findAndClickPeepInPopup(recip);
    }

    function whenAllPeepsAdded() {
      // - type in the message
      self._d.typeInTextBox({ className: clsComposeText },
                            messageText,
                            self._currentTabData['conv-compose'].tabNode);

      // - hit send
      self._d.click({ className: clsComposeSend },
                    self._currentTabData['conv-compose'].tabNode);

      // - make sure the tab goes away
      self._checkTabDelta({ 'conv-compose': -1 }, 'home');

      self._d.asyncEventsAllDoneDoResolve();
    }

    // (we expect the caller to bring up the list of converations themselves
    //  subsequent to this and verify the list of conversations includes the
    //  new conversation.)
  },

  //////////////////////////////////////////////////////////////////////////////
};

var LOGFAB = exports.LOGFAB = $log.register($module, {
  devUIDriver: {
    // we are a client/server client, even if we are smart for one
    type: $log.TEST_SYNTHETIC_ACTOR,
    subtype: $log.CLIENT,
    topBilling: false,

    events: {
      tabState: { state: true, activeTab: true },
      visiblePeeps: { names: true },
      visibleConnReqs: { namesAndMessages: true },
      visibleConvs: { firstMessages: true },
      visibleMsgs: { messages: true },
    },
    TEST_ONLY_events: {
    },

    errors: {
      peepNotAdded: { name: false },
    },
  },
});

}); // end define
