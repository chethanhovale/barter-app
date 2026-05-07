content = open('.env', 'rb').read()
clean = content.replace(b'\xef\xbb\xbf', b'')
open('.env', 'wb').write(clean)
print('Fixed! .env file cleaned.')
