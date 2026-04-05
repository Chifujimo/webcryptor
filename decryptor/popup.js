document.getElementById('decryptBtn').addEventListener('click', async () => {
  const encryptedContent = document.getElementById('encryptedData').value.trim();
  
  if (!encryptedContent) {
    alert('Please paste encrypted content');
    return;
  }
  
  const parsed = parseEncryptedContent(encryptedContent);
  if (!parsed) {
    alert('Invalid format. Expected lines starting with KEY:, IV:, DATA:');
    return;
  }
  
  const { key, iv, data } = parsed;
  
  if (!isValidBase64(key) || !isValidBase64(iv) || !isValidBase64(data)) {
    alert('Invalid Base64 encoding in KEY, IV, or DATA');
    return;
  }
  
  const btn = document.getElementById('decryptBtn');
  btn.textContent = 'Decrypting...';
  btn.disabled = true;
  
  try {
    const decryptedText = await decryptAES(key, iv, data);
    
    document.getElementById('keyOutput').textContent = key;
    document.getElementById('ivOutput').textContent = iv;
    document.getElementById('decryptedOutput').textContent = decryptedText;
    document.getElementById('result').style.display = 'block';
    document.getElementById('successMessage').textContent = 'Decryption successful!';
    document.getElementById('errorMessage').textContent = '';
    
  } catch (error) {
    document.getElementById('result').style.display = 'block';
    document.getElementById('successMessage').textContent = '';
    document.getElementById('errorMessage').textContent = 'Decryption failed: ' + error.message;
  } finally {
    btn.textContent = 'Decrypt and Show';
    btn.disabled = false;
  }
});

function parseEncryptedContent(content) {
  const lines = content.split(/\r?\n/);
  let key = null, iv = null, data = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('KEY:')) {
      key = trimmed.substring(4).trim();
    } else if (trimmed.startsWith('IV:')) {
      iv = trimmed.substring(3).trim();
    } else if (trimmed.startsWith('DATA:')) {
      data = trimmed.substring(5).trim();
    }
  }
  
  return (key && iv && data) ? { key, iv, data } : null;
}

function isValidBase64(str) {
  try {
    atob(str);
    return true;
  } catch (e) {
    return false;
  }
}

async function decryptAES(keyBase64, ivBase64, encryptedBase64) {
  const keyData = base64ToArrayBuffer(keyBase64);
  const ivData = base64ToArrayBuffer(ivBase64);
  const encryptedData = base64ToArrayBuffer(encryptedBase64);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-CBC', length: 256 },
    false,
    ['decrypt']
  );
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv: new Uint8Array(ivData) },
    key,
    encryptedData
  );
  
  return new TextDecoder().decode(decrypted);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
