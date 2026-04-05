document.getElementById('encryptBtn').addEventListener('click', async () => {
  const plainText = document.getElementById('plainText').value.trim();
  let filename = document.getElementById('filename').value.trim();
  
  if (!plainText) {
    alert('Please enter text to encrypt');
    return;
  }
  
  try {
    const btn = document.getElementById('encryptBtn');
    btn.textContent = 'Encrypting...';
    btn.disabled = true;
    
    const key = await generateKey();
    const iv = generateIV();
    const encryptedData = await encryptText(plainText, key, iv);
    
    document.getElementById('keyOutput').textContent = key;
    document.getElementById('ivOutput').textContent = iv;
    document.getElementById('dataOutput').textContent = encryptedData;
    document.getElementById('result').style.display = 'block';
    
    const fileContent = `KEY:${key}\nIV:${iv}\nDATA:${encryptedData}`;
    
    if (!filename) {
      filename = 'encrypted';
    }
    
    const fullFilename = `${filename}.txt`;
    
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    chrome.downloads.download({
      url: url,
      filename: fullFilename,
      conflictAction: 'uniquify'
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        alert('Download failed: ' + chrome.runtime.lastError.message);
      } else {
        document.getElementById('successMessage').textContent = 
          `File downloaded successfully as "${fullFilename}"`;
      }
      
      btn.textContent = 'Encrypt and Download';
      btn.disabled = false;
      URL.revokeObjectURL(url);
    });
    
  } catch (error) {
    alert('Encryption failed: ' + error.message);
    
    document.getElementById('encryptBtn').textContent = 'Encrypt and Download';
    document.getElementById('encryptBtn').disabled = false;
  }
});

async function generateKey() {
  try {
    const key = await crypto.subtle.generateKey(
      {
        name: "AES-CBC",
        length: 256
      },
      true,
      ["encrypt", "decrypt"]
    );
    
    const exportedKey = await crypto.subtle.exportKey("raw", key);
    return arrayBufferToBase64(exportedKey);
  } catch (error) {
    throw new Error('Key generation failed: ' + error.message);
  }
}

function generateIV() {
  const iv = crypto.getRandomValues(new Uint8Array(16));
  return arrayBufferToBase64(iv.buffer);
}

async function encryptText(plainText, keyBase64, ivBase64) {
  try {
    const keyData = base64ToArrayBuffer(keyBase64);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      {
        name: "AES-CBC",
        length: 256
      },
      false,
      ["encrypt"]
    );
    
    const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));
    
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-CBC",
        iv: iv
      },
      key,
      data
    );
    
    return arrayBufferToBase64(encryptedData);
  } catch (error) {
    throw new Error('Encryption process failed: ' + error.message);
  }
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (error) {
    throw new Error('Base64 decoding failed');
  }
}