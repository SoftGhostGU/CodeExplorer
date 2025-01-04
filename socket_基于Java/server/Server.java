package CN_socket.server;

import CN_socket.thread.ClientReaderThread;
import CN_socket.thread.ServerReaderThread;

import java.io.*;
import java.net.InetAddress;
import java.util.*;
import java.net.BindException;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.ArrayList;
import java.util.List;

public class Server {
    public static List<Socket> onLineSockets = new ArrayList<>();

    public static void main(String[] args) {
        System.out.println("---服务端启动---");
        int port = 8080;

        try {
            ServerSocket serverSocket = new ServerSocket(port, 50, InetAddress.getByName("0.0.0.0"));
            System.out.println("server binds to " + port);

            new Thread(() -> {
                try (Scanner scanner = new Scanner(System.in)) {
                    StringBuilder messageBuffer = new StringBuilder();
                    int emptyLineCount = 0;

                    while (true) {
                        String line = scanner.nextLine();
                        if (line.trim().isEmpty()) {
                            emptyLineCount++;
                        } else {
                            emptyLineCount = 0; // 重置计数
                        }

                        messageBuffer.append(line).append("\n");

                        if (emptyLineCount == 1) {
                            String message = messageBuffer.toString().trim(); // 去除多余的换行
                            if (!message.isEmpty()) {
                                broadcastMessage("服务端发送：\n" + message);
                            }
                            messageBuffer.setLength(0); // 清空缓冲区
                            emptyLineCount = 0; // 重置计数
                        }
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }).start();

            // 接收客户端连接
            while (true) {
                Socket socket = serverSocket.accept();
                synchronized (onLineSockets) {
                    onLineSockets.add(socket);
                }
                System.out.println("有人上线了 " + socket.getRemoteSocketAddress());
                new ServerReaderThread(socket).start();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // 广播消息给所有在线客户端
    public static void broadcastMessage(String message) {
        synchronized (onLineSockets) {
            for (Socket socket : onLineSockets) {
                try {
                    DataOutputStream dos = new DataOutputStream(socket.getOutputStream());
                    dos.writeUTF(message);
                    dos.flush();
                } catch (Exception e) {
                    System.out.println("消息发送失败：" + socket.getRemoteSocketAddress());
                }
            }
        }
    }
}
