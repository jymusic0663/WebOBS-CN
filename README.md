[原始仓库](https://github.com/t-mullen/Web-Broadcasting-Software)

# 网页直播软件 (WBS)

[![JavaScript 代码规范](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

<img width="1278" alt="截图" src="https://user-images.githubusercontent.com/14932492/61163247-02022980-a4db-11e9-8bc2-d8e74578aa2f.png">

[在线演示](https://t-mullen.github.io/Web-Broadcasting-Software/)

基于浏览器的实时直播与录制软件，灵感来源于[OBS](https://obsproject.com/)。WBS允许主播录制音视频、创建画面合成、应用视听效果，并最终输出到广播传输系统（本项目不包含传输功能实现）。

软件界面和功能模拟了开源直播软件(OBS)，但可以很容易修改以适应非技术用户。

新手使用指南：

1. 在场景(scenes)中点击"+" 
2. 在来源(sources)中点击"+"
3. 选择媒体设备
4. 可拖拽调整视频位置大小，或添加多个视频进行画面合成
5. 点击切换不同场景和活动视频源
6. "开始直播"会生成可用于其他模块的媒体流输出

## 更新信息

+ v1.1.6
  - srs推流功能解耦
  - 增加srs推流rtc功能
  - 添加本地录制功能
  - 修复index.html编码问题
  - 修复设置里读取不到保存的地址信息
+ v1.1.5
  - 增加含音频的窗口获取源
+ v1.1.4
  - 增加推流到srs直播服务器功能
  - 增加设置窗口
  - 增加浏览器本地存储直播参数配置
  - 修复音频获取问题

## 安装

```html
<script src="wbs.js"></script>
<!-- 引入srs推流器 -->
<script src="libs/srs.sdk.js"></script>
<!-- 引入录制器 -->
<script src="libs/recorder.js"></script>
```

## 使用

```html
<div></div>
<script>
  var wbs = new WBS('div') // Element or selector to place the UI

  // 推流到srs直播服务器
  //var publisher = new _SrsRtc.SrsRtcPublisherAsync();
  var publisher = new _SrsRtc.SrsRtcWhipWhepAsync();

  wbs.on('stream', function (stream) {
    // 当用户点击“开始直播”时触发
    // stream 是输出的媒体流
    publisher.stream = stream;
    publisher.publish(wbs.opts.server.url, {
      videoOnly: false,
      audioOnly: false,
      width: wbs.opts.output.width,
      height: wbs.opts.output.height,
      bitrate: wbs.opts.output.bitrate,
      fps: wbs.opts.output.fps
    }).catch(err => {
      console.error(err);
    });
  })
  wbs.on('stopstream', function () {
    // 当用户点击“停止直播”时触发
    if (publisher) {
      publisher.close();
      publisher = new _SrsRtc.SrsRtcWhipWhepAsync();
    }
  })

  // 录制
  var recorder = new WBSRecorder()
  wbs.on('startrecord', function (stream) {
    // 当用户点击“开始录制”时触发
    recorder.stream = stream
    recorder.start()
  })
  wbs.on('stoprecord', function () {
    // 当用户点击“停止录制”时触发
    recorder.stop()
  })
</script>
```

## api

### `var wbs = new WBS(element, [opts])`

`element` 是一个 `HTMLElement` 或 CSS 选择器字符串。显示区域会尝试适配到该元素内部。

此构造函数必须包裹在用户手势（如 “click” 事件监听器）内。

可选的 `opts` 是一个配置对象，用于覆盖以下默认值：

```
{
  server: {
    url: "https://live.example.com/rtc/v1/whip/?app=live&stream=livestream&secret=your_secret",  // srs 直播服务器的whip地址
  },
  output: {
    width: 1280, // 分辨率
    height: 720,
    fps: 30, // 帧率
    bitrate: 3000000 // 码率
  },
  injectStyles: true, // 是否注入 WBS 的 CSS 样式
  inputs: [array of input devices - see below]
}
```

### 添加输入设备

WBS 会自动检测系统上的音视频设备。不过，任何获取 MediaStream 的方法都可作为输入源。若要添加自定义输入源，请在 `opts.inputs` 数组中放入一个具有以下格式的对象：

```
{
  name: 'Display Name of Device', // Can be anything, but it should be descriptive
  getStream: function (callback) {
    // This function should call "callback" with the following arguments
    callback(err, name, isVideo, stream)  
      - "err" is any error thrown, null otherwise
      - "name" is the name of the device, with the kind (Video/Audio Input/Ouput) in brackets
      - "isVideo" is true if the stream will have only video tracks, false if only audio tracks.
      - "stream" is the input MediaStream
  }
}
```

示例:

```
```javascript
{
  name: '摄像头 (视频输入)',
  hasVideo: true, // false for
  getStream: function (callback) {
    getusermedia({audio:false, video:true}, function (err, stream) {
      callback(err, '摄像头', true, stream)
    })
  }
}
```

## 注意事项

`wbs` 并不会直接**直播**你的视频，它只是为你提供一个输出的 `MediaStream`，你可以根据自己的需求来使用它。

你可以通过`WebRTC`连接发送它，将其录制为文件，发送到代理`RTMP`服务器，通过`ffmpeg`进行处理……任何操作都可以。

若要查看使用 [Dat](https://datproject.org/) 和 [Beaker 浏览器](https://beakerbrowser.com/) 实现的点对点传输示例，请参阅 [wbs-plus-hypercast](https://github.com/t-mullen/wbs-plus-hypercast)。（仅适用于 Beaker 浏览器。）
