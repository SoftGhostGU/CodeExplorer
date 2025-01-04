package CN_socket.client;

import CN_socket.thread.ClientReaderThread;

import java.io.DataOutputStream;
import java.io.OutputStream;
import java.net.Socket;
import java.util.Scanner;

public class Client {
    public static void main(String[] args) throws Exception {
        Scanner sc = new Scanner(System.in);
        // 提示用户输入服务器地址和端口号
        System.out.println("please input the port of the server: ");
        String address_ = sc.nextLine();
        String address = address_.split(":")[0];
        int port_ = Integer.parseInt(address_.split(":")[1]);
        int port = 0;

        try {
            // address 是用户输入的 IP 地址，port_ 是用户输入的端口号
            if (port_ > 0 && port_ < 65535) {
                port = port_;

                // 创建 Socket 对象，请求连接到指定服务器
                Socket socket = new Socket(address, port);

                // 创建一个独立的线程，用于接收服务器发送的消息
                new ClientReaderThread(socket).start();

                // 从 Socket 的输出流中获取字节输出流，用于向服务器发送消息
                OutputStream os = socket.getOutputStream();
                DataOutputStream dos = new DataOutputStream(os);

                // 用户输入消息并发送到服务器
                Scanner scanner = new Scanner(System.in);
                System.out.println("请输入消息，输入两次换行发送：");
                StringBuilder messageBuilder = new StringBuilder();
                while (true) {
                    String line = scanner.nextLine();
                    if (line.isEmpty()) {
                        // 检测到双换行，发送消息
                        String message = messageBuilder.toString();
                        if (message.trim().isEmpty()) {
                            System.out.println("欢迎下次使用！退出成功");
                            dos.close();
                            socket.close();
                            break;
                        }
                        dos.writeUTF(message); // 发送消息
                        dos.flush(); // 刷新输出流
                        messageBuilder.setLength(0); // 清空缓冲区
                        System.out.println("消息已发送，继续输入：");
                    } else {
                        // 累积消息内容
                        messageBuilder.append(line).append("\n");
                    }
                }
            } else {
                throw new IllegalArgumentException("Invalid port: " + port_);
            }
        } catch (IllegalArgumentException e) {
            System.err.println("Wrong input: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
