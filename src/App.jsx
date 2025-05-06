import React, { useState } from 'react';
import './App.css';

function App() {
  const [input, setInput] = useState('');
  const [userName, setUserName] = useState('ゲスト'); // ユーザー名の状態を追加
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // ダミーモードをオフに設定
  const USE_DUMMY_MODE = false
  
  // GASのデプロイURLをここに設定
  // ※本番デプロイURLに書き換えてください
  const API_URL = 'https://script.google.com/macros/s/AKfycbxYv1UGmK-2O91n7ngjc_5wFS0psm0Bz_Ib-ggEULQob-PkuBPBnUl4rcWijFQ81gNzIQ/exec';
  
  // ダミーの応答を生成する関数
  const getDummyResponse = (inputText) => {
    // 入力に基づいてランダムな返答を生成
    const responses = [
      "こんにちは！お元気ですか？私はGemini AIです。何かお手伝いできることはありますか？",
      `「${inputText}」についてですね。それについては、前向きに考えることが大切です。`,
      "今日も素晴らしい一日になりますように。何か他にご質問はありますか？",
      `「${inputText}」は興味深いトピックですね。もう少し詳しく教えていただけますか？`,
      "ご質問ありがとうございます。お役に立てて嬉しいです。"
    ];
    
    // ランダムに選択
    return responses[Math.floor(Math.random() * responses.length)];
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    setLoading(true);
    setError('');
    
    // ダミーモードの場合
    if (USE_DUMMY_MODE) {
      // 少し遅延させてAPIっぽく見せる
      setTimeout(() => {
        const dummyReply = getDummyResponse(input);
        setResponse(dummyReply);
        setLoading(false);
      }, 500);
      return;
    }
    
    // 以下、実際のAPI呼び出し（ダミーモードがオフの場合）
    try {
      console.log('APIリクエスト開始:', input);
      console.log('送信するデータ:', { prompt: input, userName: userName });
      
      const result = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: input,
          userName: userName
        })
      });

      // レスポンスステータスを確認
      console.log('ステータスコード:', result.status);
      if (!result.ok) {
        let errorMsg = `APIエラー: ステータスコード ${result.status}`;
        if (result.status === 0) {
          console.error('CORSエラーの可能性があります');
          errorMsg = 'CORSエラーが発生しました。以下を確認してください：\n' +
                    '1. GASのCORS設定でVercelドメインが許可されているか\n' +
                    '2. API_URLが正しいか\n' +
                    '3. GASスクリプトがウェブアプリとして公開されているか';
        }
        setError(errorMsg);
        setLoading(false);
        return;
      }
      
      // テキストとして取得
      const textResponse = await result.text();
      console.log('生のレスポンス:', textResponse);

      // JSON解析を試みる
      try {
        // 前後に余計な文字があるかもしれないので除去
        let cleanText = textResponse.trim();
        
        // HTMLタグが含まれている場合の対応
        if (cleanText.includes('<html') || cleanText.includes('<!DOCTYPE')) {
          console.error('HTMLレスポンスが返されました:', cleanText);
          setError('HTMLレスポンスが返されました。GASの設定を確認してください。');
          setResponse(cleanText.substring(0, 200) + '...'); // 一部だけ表示
          return;
        }
        
        // JSONとして解析
        const data = JSON.parse(cleanText);
        console.log('解析されたデータ:', data);
        
        if (data.status === "error") {
          setError(`APIエラー: ${data.message || 'unknown error'}`);
          return;
        }
        
        setResponse(data.reply || '応答なし');
      } catch (parseError) {
        console.error('JSONパースエラー:', parseError);
        setError('レスポンス形式が不正です: ' + parseError.message);
        setResponse(textResponse); // 生のテキストを表示
      }
    } catch (fetchError) {
      console.error('API通信エラー:', fetchError);
      setError('API通信エラー: ' + fetchError.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="App" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Gemini APIテスト {USE_DUMMY_MODE && '(ダミーモード)'}</h1>
      
      {/* ユーザー名入力フィールドを追加 */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>お名前:</label>
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="お名前を入力してください"
          style={{ width: '70%', padding: '10px', marginRight: '10px' }}
        />
      </div>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="質問を入力してください"
          style={{ width: '70%', padding: '10px', marginRight: '10px' }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: '10px 20px' }}
        >
          {loading ? '送信中...' : '送信'}
        </button>
      </form>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '20px', whiteSpace: 'pre-line' }}>
          <strong>エラー:</strong> {error}
        </div>
      )}
      
      {response && (
        <div style={{ border: '1px solid #ddd', borderRadius: '5px', padding: '15px' }}>
          <h3>AI応答:</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{response}</p>
        </div>
      )}
    </div>
  );
}

export default App;
