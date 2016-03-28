/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var connected = false;
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        StatusBar.hide();
        StatusBar.overlaysWebView(false);
//        screen.lockOrientation('landscape');
        app.receivedEvent('deviceready');

        document.addEventListener('online', app.onOnline, false);
        document.addEventListener('offline', app.onOffline, false);
    },
    onOnline: function() {
        app.receivedEvent('online');
        connected = true;
    },
    onOffline: function(){
        app.receivedEvent('offline');
        connected = false;
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        console.log('event: ' + id);
//console.log(window.device);
	/*      window.alert = navigator.notification.alert;
      function alertDismissed() {
          console.log(window.device);
      }

      navigator.notification.alert(
          'You are the winner!',  // message
          alertDismissed,         // callback
          'Game Over',            // title
          'Done'                  // buttonName
      );

        window.addEventListener("orientationchange", function(){
            console.log(screen.orientation);
        });
        
        setInterval(function(){console.log(navigator.connection)}, 1000);
*/
        // try to connect to server
        $.support.cors = true;
        $.ajax({
            url:  'https://mr-media.de/robots.txt',
            timeout: 3000,
            cache: false,
            crossDomain: true
        })
        .done(function(data, status, xhr) {
console.log('init()'+status);
            if(status == 'success' && data)
                connected = true;
            init();
        })
        .fail(function(err) {
            connected = false;
            init();
        });
    }
};

