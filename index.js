const amqplib = require('amqplib');

const _3MB = 3 * 1024 * 1024;
const _9MB = 9 * 1024 * 1024;
const _5s = 5000;
const _30s = 30000;

const _options = Date.now() % 2 === 0
  ? { headers: { 'x-foo': 100, 'x-bar': 'wibble'} }
  : { headers: { 'x-very-long-header': 100 } };

(async () => {
  try {
    const connection = await amqplib.connect('amqp://localhost:5672')
    connection.on('close', (err) => {
      throw new Error('Closed', err)
    }).on('error', (err) => {
      // debugger;
      throw new Error('Error', err)
    });

    const channel = await connection.createConfirmChannel();
    await channel.assertExchange('e-725')

    for (let i = 0; i < 1000; i++) {
      const size = Math.floor(Math.random() * (_9MB - _3MB + 1)) + _3MB;
      const content = 'x'.repeat(size);

      const ttlHeader = Date.now() % 2 === 0
        ? { 'x-cache-ttl': Math.floor(Math.random() * _30s) + _5s }
        : {};

      const headers = _options && _options.headers ? { ...ttlHeader, ..._options.headers } : ttlHeader;

      const options = {
        ..._options,
        headers,
      };

      channel.publish('e-725', '', Buffer.from(content), options);
      console.log('Published', content.length, options)
    };

    console.log('Waiting');
    await channel.waitForConfirms();
    console.log('Received all confirms');

    await channel.close();
    await connection.close();
  } catch (error) {
    console.log('CAUGHT', error)
  }

})();

