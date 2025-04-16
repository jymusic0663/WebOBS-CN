
//
// Copyright (c) 2013-2021 Winlin
//
// SPDX-License-Identifier: MIT
//

'use strict';
function SrsRtcWhipWhepAsync() {
  var self = {};

  // See https://datatracker.ietf.org/doc/draft-ietf-wish-whip/
  // @url The WebRTC url to publish with, for example:
  //      http://localhost:1985/rtc/v1/whip/?app=live&stream=livestream
  // @options The options to control playing, supports:
  //      videoOnly: boolean, whether only play video, default to false.
  //      audioOnly: boolean, whether only play audio, default to false.
  self.publish = async function (url, options) {
      if (url.indexOf('/whip/') === -1) throw new Error(`invalid WHIP url ${url}`);
      if (options?.videoOnly && options?.audioOnly) throw new Error(`The videoOnly and audioOnly in options can't be true at the same time`);

      // @see https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/addStream#Migrating_to_addTrack
      self.stream.getTracks().forEach(function (track) {
          self.pc.addTrack(track);

          // Notify about local track when stream is ok.
          self.ontrack && self.ontrack({track: track});
      }); 
    /* self.stream.getVideoTracks().forEach(track => {
        self.pc.addTransceiver(track, {
            direction: 'sendonly',
            streams: [self.stream],
            sendEncodings: [{
                scaleResolutionDownBy: 1.0,
                maxBitrate: (options.bitrate * 1.5) || 5000000,
                minBitrate: (options.bitrate * 0.8) || 2000000,
                rid: 'f',
                scalabilityMode: 'L1T1',
                maxFramerate: options.fps || 30,
                adaptation: { algorithm: 'none' }
            }]
        });
    });
    self.stream.getAudioTracks().forEach(track => {
        self.pc.addTransceiver(track, {
            direction: 'sendonly',
            streams: [self.stream],
            sendEncodings: [{
                maxBitrate: 256000
            }]
        });
    }); */

      var offer = await self.pc.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
        // 添加分辨率约束
        // iceRestart: false,
        // voiceActivityDetection: false,
        codecPreferences: ['H264', 'VP8'],
        width: options.width || 1280,
        height: options.height || 720,
        frameRate: options.fps || 30
      });
      await self.pc.setLocalDescription(offer);
      const answer = await new Promise(function (resolve, reject) {
          // console.log(`Generated offer: ${offer.sdp}`);

          const xhr = new XMLHttpRequest();
          xhr.onload = function() {
              if (xhr.readyState !== xhr.DONE) return;
              if (xhr.status !== 200 && xhr.status !== 201) return reject(xhr);
              const data = xhr.responseText;
              // console.log("Got answer: ", data);
              return data.code ? reject(xhr) : resolve(data);
          }
          xhr.open('POST', url, true);
          xhr.setRequestHeader('Content-type', 'application/sdp');
          xhr.send(offer.sdp);
      });
      await self.pc.setRemoteDescription(
          new RTCSessionDescription({type: 'answer', sdp: answer})
      );

      return self.__internal.parseId(url, offer.sdp, answer);
  };

  // See https://datatracker.ietf.org/doc/draft-ietf-wish-whip/
  // @url The WebRTC url to play with, for example:
  //      http://localhost:1985/rtc/v1/whep/?app=live&stream=livestream
  // @options The options to control playing, supports:
  //      videoOnly: boolean, whether only play video, default to false.
  //      audioOnly: boolean, whether only play audio, default to false.
  self.play = async function(url, options) {
      if (url.indexOf('/whip-play/') === -1 && url.indexOf('/whep/') === -1) throw new Error(`invalid WHEP url ${url}`);
      if (options?.videoOnly && options?.audioOnly) throw new Error(`The videoOnly and audioOnly in options can't be true at the same time`);

      if (!options?.videoOnly) self.pc.addTransceiver("audio", {direction: "recvonly"});
      if (!options?.audioOnly) self.pc.addTransceiver("video", {direction: "recvonly"});

      var offer = await self.pc.createOffer();
      await self.pc.setLocalDescription(offer);
      const answer = await new Promise(function(resolve, reject) {
          // console.log(`Generated offer: ${offer.sdp}`);

          const xhr = new XMLHttpRequest();
          xhr.onload = function() {
              if (xhr.readyState !== xhr.DONE) return;
              if (xhr.status !== 200 && xhr.status !== 201) return reject(xhr);
              const data = xhr.responseText;
              // console.log("Got answer: ", data);
              return data.code ? reject(xhr) : resolve(data);
          }
          xhr.open('POST', url, true);
          xhr.setRequestHeader('Content-type', 'application/sdp');
          xhr.send(offer.sdp);
      });
      await self.pc.setRemoteDescription(
          new RTCSessionDescription({type: 'answer', sdp: answer})
      );

      return self.__internal.parseId(url, offer.sdp, answer);
  };

  // Close the publisher.
  self.close = function () {
      self.pc && self.pc.close();
      self.pc = null;
  };

  // The callback when got local stream.
  // @see https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/addStream#Migrating_to_addTrack
  self.ontrack = function (event) {
      // Add track to stream of SDK.
      self.stream.addTrack(event.track);
  };

  self.pc = new RTCPeerConnection({
    bundlePolicy: 'max-bundle',  // 合并多个轨道到单个传输通道（减少端口占用）
    rtcpMuxPolicy: 'require',    // RTCP与RTP复用同一端口（NAT穿透必需）
    encodedInsertableStreams: false,
    // peerIdentity: 'fixed-bitrate',
    // forceNegotiatedDtlsSrtp: true,
    // sdpSemantics: 'unified-plan',
    iceTransportPolicy: 'all',
    iceServers: []
  });

  // To keep api consistent between player and publisher.
  // @see https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/addStream#Migrating_to_addTrack
  // @see https://webrtc.org/getting-started/media-devices
  self.stream = null;

  // Internal APIs.
  self.__internal = {
      parseId: (url, offer, answer) => {
          let sessionid = offer.substr(offer.indexOf('a=ice-ufrag:') + 'a=ice-ufrag:'.length);
          sessionid = sessionid.substr(0, sessionid.indexOf('\n') - 1) + ':';
          sessionid += answer.substr(answer.indexOf('a=ice-ufrag:') + 'a=ice-ufrag:'.length);
          sessionid = sessionid.substr(0, sessionid.indexOf('\n'));

          //const a = document.createElement("a");
          //a.href = url;
          return {
              sessionid: sessionid, // Should be ice-ufrag of answer:offer.
              //simulator: a.protocol + '//' + a.host + '/rtc/v1/nack/',
          };
      },
  };

  // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/ontrack
  self.pc.ontrack = function(event) {
      if (self.ontrack) {
          self.ontrack(event);
      }
  };

  return self;
}

module.exports = { SrsRtcWhipWhepAsync }