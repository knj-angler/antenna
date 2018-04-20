// 変数
var ConsumerKey = '***************'
var ConsumerSecret = '***************'
var AccessToken = '***************'
var AccessTokenSecret = '***************'

// chatwork config
var token = "***************"; // APIトークン
var group = 0000000 // チャット板ID

// タイムライン取得用URL
// APIドキュメント：https://developer.twitter.com/en/docs/api-reference-index
var EndPoint = "https://api.twitter.com/1.1/statuses/user_timeline.json"

// OAuth1認証用インスタンス
var twitter = TwitterWebService.getInstance(
  '***************',
  '***************'
);

// 認証を行う（必須）
function authorize() {
  twitter.authorize();
}

// 認証後のコールバック（必須）
function authCallback(request) {
  return twitter.authCallback(request);
}

/**
 * シートのの取得
 */
// Twitterシート取得
var Tsheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Twitter');
var TlastRow = Tsheet.getLastRow();

// RSSシート取得
var Rsheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('RSS');
var RlastRow = Rsheet.getLastRow();

// Facebookシート取得
var Fsheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Facebook');
var FlastRow = Fsheet.getLastRow();

// PRTIMESシート取得
var Psheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('PRTIMES');
var PlastRow = Psheet.getLastRow();

/**
 * Facebookシートの関数
 * @param {*} group 
 * @param {*} token 
 */
function GetFacebookPageFeed(group, token) {
  for(var i = FlastRow; i >= 1; i--) { // 最終行から順にデータをセルから取得している
      var FacebookPageId = Fsheet.getRange(i, 1).getValue(); // セルから取得したRSS URLを変数に格納
      Logger.log(FacebookPageId);
      var FacebookPageName = Fsheet.getRange(i, 2).getValue(); // セルから取得したサイト名を変数に格納
    if (FacebookPageId !== 'Facebook page ID') {
      var FacebookList =  GetFacebookPageFeed(FacebookPageId);
      var Flag = CheckFacebookId(FacebookList[1], i)
      if(Flag == true) {
          ChatNotifyFacebook(group, token, SiteName, RssList[0], RssList[1]);
      }
    } else {
      Logger.log('TwitterIdが不正なので処理を抜けます');
      break;
    }
  }
}

function FacebookPageFeed(FacebookPageId) {
  var Token = '***************';
  var json = UrlFetchApp.fetch('https://graph.facebook.com/v2.10/?id=' + url + '&fields=engagement&access_token=' + Token);  
}

function GetRss(group, token) {
    for(var i = RlastRow; i >= 1; i--) { // 最終行から順にデータをセルから取得している
        var RssUrl = Rsheet.getRange(i, 1).getValue(); // セルから取得したRSS URLを変数に格納
        Logger.log(RssUrl);
        var SiteName = Rsheet.getRange(i, 2).getValue(); // セルから取得したサイト名を変数に格納
      if (RssUrl !== 'RSS URL') {
        var RssList =  GetPost(RssUrl);
        var Flag = CheckRssUrl(RssList[1], i)
        if(Flag == true) {
            ChatNotifyRss(group, token, SiteName, RssList[0], RssList[1]);
        }
      } else {
        Logger.log('TwitterIdが不正なので処理を抜けます');
        break;
      }
    }
}

/**
 * フィードから最新記事のURLとタイトルを返却する関数
 * @param {セルから取得したRSS URL} RssUrl 
 */
function GetPost(RssUrl) {
    var response = UrlFetchApp.fetch(RssUrl); // この時点でXML形式のフィードを取得
    // XMLをパース
    var xml = XmlService.parse(response.getContentText());
    var items = xml.getRootElement().getChildren('channel')[0].getChildren('item');
    // タイトル取得
    var title = items[0].getChild("title").getText();
    // URL取得
    var posturl = items[0].getChild("link").getText();
    var RssList = [];
    RssList.push(title); // RSSから取得したタイトルをリストに追加
    RssList.push(posturl); // RSSから取得したURLをリストに追加
    return RssList;
}


/**
 * チェック用セルに値をセットする関数
 * @param {対象のurl} target 
 * @param {ループで出力される回数値} line 
 */
function InsertToCheckRss (target, line) {
    Rsheet.getRange(line, 3).setValue(target); // チェック用セルにIDをセット
}



/**
 * チェック用ツイートIDとAPIで取得したIDが重複していれば、falseを返却する関数
 * @param {TweetList[0が入る]} TweetId 
 * @param {ループで出力される回数値} line 
 */
function CheckRssUrl (RssUrl, line) {
    var Flag = false
    var CheckRssUrl = Rsheet.getRange(line, 3).getValue(); // セルから取得したチェック用urlを変数に格納する
    // チェック用urlとAPIで取得したIurlが一致していればFlag変数にfalseを格納する
    if (CheckRssUrl == RssUrl) {
        Flag = false;
        Logger.log('urlが重複しております。');
    } else {
        Flag = true
        InsertToCheckRss(RssUrl,line); // チェック用セルに値値をセット        
    }
    return Flag; // この真偽値を利用してchatworkで通知を飛ばすか判断する
}


/**
 * 関数のループ
 * Twitter関連で実行する関数はこの関数に集約される
 */
function GetTwitter(group, token) {
    for(var i = TlastRow; i >= 1; i--) { // 最終行から順にデータをセルから取得している
        // 最新のツイート取得
        var TwitterId = Tsheet.getRange(i, 1).getValue(); // セルから取得したTwiiterIDを変数に格納
        var TwitterName = Tsheet.getRange(i, 2).getValue(); // セルから取得したアカウント名を変数に格納
      if (TwitterId !== 'Twitter user ID') {
        var TweetList =  GetTweet(TwitterId);
        var Flag = CheckTweetId(TweetList[0], i)
        if(Flag == true) {
            ChatNotify(group, token, TwitterName, TweetList[1]);
        }
      } else {
        Logger.log('TwitterIdが不正なので処理を抜けます');
        break;
      }
    }
}

/**
 * アカウントIDを引数にして、最新のツイートを返却する関数
 * @param {セルで取得するアカウントID} TwitterId 
 */
function GetTweet(TwitterId) {
    var count = '1'; // 取得すツイートの数
    var ExcludeReplies = 'true'; // リプライ
    var IncludeRts = 'false'; // リツイートを含むかどうか
    var service  = twitter.getService(); // オブジェクト作成
    var response = service.fetch('https://api.twitter.com/1.1/statuses/user_timeline.json?user_id=' + TwitterId + '&count=' + count + '&include_rts=' + IncludeRts + '&exclude_replies=' + ExcludeReplies);
    var Tweet = JSON.parse(response); // tweetにjsonが格納される
    // 取得したtweetから（text, id）を取得する
    var TweetList = [];
    TweetList.push(Tweet[0]['id']); // ツイートIDをリストに追加
    TweetList.push(Tweet[0]['text']); // ツイートテキストをリストに追加
    return TweetList;
}

/**
 * チェック用セルに値をセットする関数
 * @param {対象のID} target 
 * @param {ループで出力される回数値} line 
 */
function InsertToCheckTwitter (target, line) {
    Tsheet.getRange(line, 3).setValue(target); // チェック用セルにIDをセット
}

/**
 * チェック用ツイートIDとAPIで取得したIDが重複していれば、falseを返却する関数
 * @param {TweetList[0が入る]} TweetId 
 * @param {ループで出力される回数値} line 
 */
function CheckTweetId (TweetId, line) {
    var Flag = false
    var CheckId = Tsheet.getRange(line, 3).getValue(); // セルから取得したチェック用IDを変数に格納する
    // チェック用IDとAPIで取得したIDが一致していればFlag変数にfalseを格納する
    if (CheckId == TweetId) {
        Flag = false;
        Logger.log('idが重複しております。');
    } else {
        Flag = true
        InsertToCheckTwitter(TweetId,line); // チェック用セルに値値をセット        
    }
    return Flag; // この真偽値を利用してchatworkで通知を飛ばすか判断する
}

/**
 * チャットワークに通知する関数
 * @param {chatwork group id} group 
 * @param {mytoken} token 
 * @param {アカウント名} name 
 * @param {ツイート内容} text
 */
function ChatNotify(group, token, name, text) {
    var client = ChatWorkClient.factory({token: token}); // Chatwork API トークンを記載    
    // chat本文
    body = "";
    body += '[info]' + 'Twitterアカウント名：　' + name + '\n' + 'ツイート：　' + text + '[/info]'; // チャットワークに通知する本文
    client.sendMessage({
        room_id: group, // チャットを通知したいグループチャットのIDを記載
        body: body}); // チャットの文章を記載
}

/**
 * チャットワークに通知する関数
 * @param {chatwork group id} group 
 * @param {mytoken} token 
 * @param {アカウント名} site
 * @param {ツイート内容} title 
 * @param {ツイート内容} url
 */
function ChatNotifyRss(group, token, site, title, url) {
    var client = ChatWorkClient.factory({token: token}); // Chatwork API トークンを記載    
    // chat本文
    body = "";
    body += '[info]' + 'サイト名：　' + site + '\n' + '記事タイトル：　' + title + '\n' + url + '[/info]'; // チャットワークに通知する本文
    client.sendMessage({
        room_id: group, // チャットを通知したいグループチャットのIDを記載
        body: body}); // チャットの文章を記載
}

function getMail() {
  var label = "prtimes";
  var start = 0;
  var max = 1;
  return GmailApp.search('label:' + label, start, max);
} 

function getDatabyMailBody( body ) {
  // <br>タグがあったら改行コードに変換する
  var str = body.replace(/<br(\s+\/)?>/g, "\n");
  /* 適時必要な形式に正規表現などで変換してください */
  var id = str.match(/id: ([0-9]+)/g);
  var code = str.match(/errorcode: .*[^\n]/g);

  return {
    id: id,
    code: code
  };
}

function GetPRtimes(group, token) {
  // 指定した条件でGmailを取得する
  var threads = getMail();
  Logger.log('①：' + threads);
  threads.forEach(function(thread) {
    var messages = thread.getMessages();
    Logger.log('②：' + messages);
    messages.forEach(function(message) {
      var subject = message.getSubject();
      var body = message.getSubject();
      Logger.log('③：' + body);
      Logger.log('⑤' + message.getId());
      var GmailId = message.getId();
      var Flag = CheckPrtimesId(GmailId, 1);
      if(Flag == true) {
        ChatNotifyPrtimes(group, token, body);
        Logger.log('成功');
      } else {
        Logger.log('PRTIMES Gmail IDが重複しております。');
      }
    });
  });
}

function CheckPrtimesId (gmailid, line) {
  var Flag = false
  var CheckPrtimesId = Psheet.getRange(line, 1).getValue(); // セルから取得したチェック用urlを変数に格納する
  Logger.log('gmailid' + gmailid);
  // チェック用urlとAPIで取得したIurlが一致していればFlag変数にfalseを格納する
  if (CheckPrtimesId == gmailid) {
      Flag = false;
      Logger.log('PRTIMES Gmail IDが重複しております。');
  } else {
      Flag = true
      InsertToCheckPrtimes(gmailid,line); // チェック用セルに値値をセット
  }
  return Flag; // この真偽値を利用してchatworkで通知を飛ばすか判断する
}

// 他の関数内で利用
function InsertToCheckPrtimes(target, line) {
  Psheet.getRange(line, 1).setValue(target); // チェック用セルにIDをセット
}

function ChatNotifyPrtimes(group, token, text) {
  var client = ChatWorkClient.factory({token: token}); // Chatwork API トークンを記載    
  // chat本文
  body = "";
  body += '[info]' + 'PRTIMES by Gmail' + '\n' + text + '[/info]'; // チャットワークに通知する本文
  client.sendMessage({
      room_id: group, // チャットを通知したいグループチャットのIDを記載
      body: body}); // チャットの文章を記載
}

/**
 * 最終的に実行する関数をantennaで実行する
 */
function antenna() {
    GetTwitter(group, token);
    GetRss(group, token);
    GetPRtimes(group, token);
  }

