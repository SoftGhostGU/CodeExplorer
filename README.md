# CodeExplorer

## Socket

This project demonstrates a simple Java-based socket communication system that supports duplex communication between a server and multiple clients. Clients can connect to the server, send messages, and receive broadcasts from the server or other clients. This setup allows communication either within the same machine or across different machines on the same network or the internet.

---

### Features

- **Duplex Communication**: Both the server and the clients can send and receive messages.
- **Multi-Client Support**: The server handles multiple clients simultaneously.
- **Message Broadcasting**: Messages sent by a client or the server are broadcast to all connected clients.
- **Dynamic Configuration**: Clients can specify the server's IP and port during connection.
- **Graceful Client Disconnect**: Detects and handles client disconnections.

---


### Project Structure

```
CN_socket/
|-- server/
|   |-- Server.java           # Main server program
|-- client/
|   |-- Client.java           # Main client program
|-- thread/
|   |-- ServerReaderThread.java  # Handles server-side client communication
|   |-- ClientReaderThread.java  # Handles client-side server communication
```

---

### Setup and Usage

#### 1. Clone the Repository
```bash
git clone <repository_url>
cd <repository_folder>
```

#### 2. Compile the Code
Navigate to the `CN_socket` directory and run:
```bash
javac server/Server.java client/Client.java thread/*.java
```

#### 3. Run the Server
On the machine intended to host the server, execute:
```bash
java server.Server
```
- The server will start on port `8080` by default.

#### 4. Run the Client
On the same or a different machine, execute:
```bash
java client.Client
```
- When prompted, input the server’s IP address and port (e.g., `192.168.3.86:8080`).

---

### Communication Example
1. Start the server:
   ```
   ---服务端启动---
   server binds to 8080
   ```
2. Start a client and connect to the server:
   ```
   connect to 192.168.3.86:8080
   请输入消息，输入两次换行发送：
   ```
3. Send a message from the client. The server will log the message and broadcast it to all clients:
   ```
   server receives messages:
   Hello, World! -- from /192.168.3.86:12345
   server sends messages:
   Hello, World!
   ```

---

### Customization

- **Change Port**:
  Modify the `port` variable in `Server.java` and `Client.java`.
- **Broadcast Logic**:
  Customize the `broadcastMessage` method in `Server.java` or the `sendMsgToAll` method in `ServerReaderThread.java`.
- **Message Format**:
  Adjust message handling in `ClientReaderThread.java` and `ServerReaderThread.java`.

---

### Notes

- Ensure the server’s port is open and accessible (check firewall settings).
- For cross-network communication, the server must have a public IP or port forwarding enabled.

---

### License
This project is licensed under the MIT License. Feel free to use and modify it as needed.

---

### Contributions
Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

