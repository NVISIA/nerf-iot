# Nerf IoT Web Application
This is a [Node.js](https://nodejs.org/en/) + [Angular 2.0](https://angular.io/) web application that uses the [JSPM](http://jspm.io/) package manager to manage server/client dependency libraries, as well as configuring with the [SystemJS](https://github.com/systemjs/systemjs) universal dynamic module loader/transpiler. The server code is written in Javascript (ES5), whereas the client code is written in [TypeScript](http://www.typescriptlang.org/), the preferred language of Angular 2.0.

The primary mechanism of communication between the server and clients is [socket.io](http://socket.io/).

## Setup
Install Node.js, jspm, [Mocha](https://mochajs.org/), and [forever](https://www.npmjs.com/package/forever) via Homebrew and [npm](https://www.npmjs.com/). [Homebrew](http://brew.sh/) is a package manager for OS X. Substitute your favorite package manager on other operated systems.
```
brew install node
npm install -g jspm
npm install -g mocha
npm install -g forever
```

Install dependencies.
```
npm install
jspm install
```

Run the server.
```
node index.js
```

## Integration Test
Run the integration tests (run this in a new terminal while node is still running).
```
mocha test.js
```

## Client
Navigate to http://localhost:3000.

## Daemon
Run the Node.js application forever. This must be run at each server start, either from the command line, or set up as a service.
```
forever start index.js
```
