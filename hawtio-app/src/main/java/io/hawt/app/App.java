/**
 * Copyright (C) 2013 the original author or authors.
 * See the notice.md file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package io.hawt.app;

import io.hawt.embedded.Main;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;

/**
 */
public class App {
    private static final String WAR_FILENAME = "hawtio.war";
    private static final int KB = 1024;

    public static void main(String[] args) {
        Main main = new Main();
        try {
            String virtualMachineClass = "com.sun.tools.attach.VirtualMachine";
            try {
                Class<?> aClass = loadClass(virtualMachineClass, App.class.getClassLoader(), Thread.currentThread().getContextClassLoader());
                //System.out.println("Found " + aClass + " on the classpath!");
            } catch (Exception e) {
                // lets try find the tools.jar instead
                String path = System.getProperty("java.home", ".");
                String jreSuffix = File.separator + "jre";
                if (path.endsWith(jreSuffix)) {
                    path = path.substring(0, path.length() - jreSuffix.length());
                }
                File file = new File(path, "lib/tools.jar");
                if (file.exists()) {
                    //System.out.println("Found tools.jar at " + file);
                    main.setExtraClassPath("file://" + file.getCanonicalPath());
                } else {
                    System.out.println("Failed to load class " + virtualMachineClass + " and find tools.jar at " + file + ". " + e);
                }
            }

            ClassLoader classLoader = Thread.currentThread().getContextClassLoader();
            URL resource = classLoader.getResource(WAR_FILENAME);
            if (resource == null) {
                System.err.println("Could not find the " + WAR_FILENAME + " on classpath!");
                System.exit(1);
            }
            File warFile = File.createTempFile("hawtio-", ".war");
            //System.out.println("Extracting " + WAR_FILENAME + " to " + warFile + " ...");
            writeStreamTo(resource.openStream(), new FileOutputStream(warFile), 64 * KB);

            String warPath = warFile.getCanonicalPath();
            main.setWarLocation(warPath);

            if (args.length > 0) {
                String portText = args[0].toLowerCase();
                if (portText.startsWith("?") || portText.startsWith("-h") || portText.startsWith("--h")) {
                    System.out.println("Usage: [portName] [contextPath]");
                    return;
                }
                try {
                    int port = Integer.parseInt(portText);
                    main.setPort(port);
                } catch (NumberFormatException e) {
                    System.out.println("Failed to parse port number '" + portText + "'. " + e);
                    return;
                }
            }
            if (args.length > 1) {
                main.setContextPath(args[1]);
            }
            Main.doRun(main);
        } catch (Exception e) {
            System.out.println("Failed to create hawtio: " + e);
            e.printStackTrace();
        }
    }

    private static Class<?> loadClass(String name, ClassLoader... classLoaders) throws ClassNotFoundException {
        for (ClassLoader classLoader : classLoaders) {
            try {
                return classLoader.loadClass(name);
            } catch (ClassNotFoundException e) {
                // ignore
            }
        }
        return Class.forName(name);
    }

    public static int writeStreamTo(final InputStream input, final OutputStream output, int bufferSize) throws IOException {
        int available = Math.min(input.available(), 256 * KB);
        byte[] buffer = new byte[Math.max(bufferSize, available)];
        int answer = 0;
        int count = input.read(buffer);
        while (count >= 0) {
            output.write(buffer, 0, count);
            answer += count;
            count = input.read(buffer);
        }
        return answer;
    }

}
