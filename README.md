# VAHAN BASIC CMS BACKEND

## Prerequisites

Before you begin, ensure you have met the following requirements:

- You have installed [Node.js](https://nodejs.org/en/download/) (which includes npm).
- You have a MySQL server running and accessible.

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/bhaveymunjal/vahan-backend.git
cd vahan-backend
```

### 2. Create a .env File

```bash
touch .env
```
-Add the following content to the .env file:

```bash
PORT=YOUR_PORT_NUMBER_BACKEND 
DB_HOST=YOUR_HOSTNAME
DB_PORT=PORT_NO_FOR_BACKEND
DB_USER=YOUR_USER
DB_PASSWORD=YOUR_PASSWORD
DB_DATABASE=YOUR_DATABASE
```

### 3. Install Dependencies
-If you don't have nodemon installed globally on your system, install it first:

```bash
npm install -g nodemon
```

-Then, install the project dependencies:
```bash
npm install
```

### Starting the Backend
-To start the backend server, run:

```bash
nodemon src/index.js
```
