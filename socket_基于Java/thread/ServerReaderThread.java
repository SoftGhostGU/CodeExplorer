package CN_socket.thread;

import CN_socket.server.Server;

import java.io.*;
import java.net.Socket;

public class ServerReaderThread extends Thread {
    private Socket socket;
    public ServerReaderThread(Socket socket) {
        this.socket = socket;
    }

    @Override
    public void run() {
        InputStream is = null;
        try {
            is = socket.getInputStream();
            DataInputStream dis = new DataInputStream(is);
            while (true) {
                try {
                    String message = dis.readUTF();
                    System.out.println("server receives messages: ");
                    System.out.println(message + " -- from " + socket.getRemoteSocketAddress());
                    System.out.println();
                    // 发送给其他所有用户
                    System.out.println("server sends messages: ");
                    System.out.println(message);
                    sendMsgToAll(message);
                } catch (Exception e) {
                    System.out.println("有人下线了 " + socket.getRemoteSocketAddress());
                    Server.onLineSockets.remove(socket);
                    dis.close();
                    socket.close();
                    break;
                }
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private void sendMsgToAll(String msg) throws IOException {
        // 发送给其他所有的socket
        for (Socket onLineSocket: Server.onLineSockets) {
            if (onLineSocket.equals(socket)) {
                continue;
            }
            OutputStream os = onLineSocket.getOutputStream();
            DataOutputStream dos = new DataOutputStream(os);
            dos.writeUTF(msg + " -- from " + socket.getRemoteSocketAddress());
            dos.flush();
        }
    }
}
