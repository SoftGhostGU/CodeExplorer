package CN_socket.thread;

import CN_socket.server.Server;

import java.io.DataInputStream;
import java.io.InputStream;
import java.net.Socket;
import java.util.ArrayList;
import java.util.List;

public class ClientReaderThread extends Thread {
    private Socket socket;
    public ClientReaderThread(Socket socket) {
        this.socket = socket;
    }

    @Override
    public void run() {
        System.out.println("connect to 127.0.0.1:8080");
        InputStream is = null;
        try {
            is = socket.getInputStream();
            DataInputStream dis = new DataInputStream(is);
            while (true) {
                try {
                    String message = dis.readUTF();
                    System.out.println(message);
                } catch (Exception e) {
                    System.out.println("自己下线了" + socket.getRemoteSocketAddress());
                    dis.close();
                    socket.close();
                    break;
                }
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
