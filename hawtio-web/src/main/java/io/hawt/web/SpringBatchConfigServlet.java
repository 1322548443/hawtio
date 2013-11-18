package io.hawt.web;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.net.URISyntaxException;
import java.net.URL;
import java.util.*;

/**
 * Created with IntelliJ IDEA.
 * User: prashant
 * Date: 13/11/13
 * Time: 3:02 PM
 * To change this template use File | Settings | File Templates.
 */
public class SpringBatchConfigServlet extends HttpServlet {

    private static final transient Logger LOG = LoggerFactory.getLogger(SpringBatchConfigServlet.class);

    @Override
    public void doGet(HttpServletRequest httpServletRequest,
                      HttpServletResponse httpServletResponse) throws IOException, ServletException {

        InputStream propsIn = SpringBatchConfigServlet.class.getClassLoader().getResourceAsStream("springbatch.properties");
        Properties properties = new Properties();
        properties.load(propsIn);
        JSONObject responseJson = new JSONObject();
        JSONArray springBatchServersJson = new JSONArray();
        List<? extends String> springBatchServers = Arrays.asList(properties.getProperty("springBatchServerList").split(","));
        springBatchServersJson.addAll(springBatchServers);
        responseJson.put("springBatchServerList", springBatchServersJson);
        String res = "success";

        httpServletResponse.setHeader("Content-type","application/json");
        httpServletResponse.getWriter().println(responseJson.toJSONString());
    }


    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        File file = getPropertiesFile("springbatch.properties");
        Properties properties = getProperties(file);
        String server = req.getParameter("server");
        if(server != null && !server.isEmpty()){
            properties.setProperty("springBatchServerList",properties.getProperty("springBatchServerList")+","+server);
            properties.store(new FileOutputStream(file), null);
            resp.getWriter().print("updated");
        }
        else {
            resp.getWriter().print("failed");
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        File file = getPropertiesFile("springbatch.properties");
        Properties properties = getProperties(file);
        String server = req.getParameter("server");
        if(server != null && !server.isEmpty()){
            String[] servers = properties.getProperty("springBatchServerList").split(",");
            List<String> serverList = new ArrayList<String>(Arrays.asList(servers));
            serverList.remove(server);
            properties.setProperty("springBatchServerList",join(serverList,","));
            properties.store(new FileOutputStream(file), null);
            resp.getWriter().print("deleted");
        }
        else {
            resp.getWriter().print("failed");
        }
    }

    private File getPropertiesFile(String name){
        URL propsUrl = SpringBatchConfigServlet.class.getClassLoader().getResource(name);
        File file = null;
        try{
            file = new File(propsUrl.toURI());
        }catch (URISyntaxException s){
            LOG.error(s.getMessage());
        }
        return file;
    }

    private Properties getProperties(File file) throws IOException{
        FileInputStream propsIn = new FileInputStream(file);
        Properties properties = new Properties();
        properties.load(propsIn);
        return properties;
    }

    private String join(List<String> list, String div){
        StringBuffer buffer = new StringBuffer();
        for (String e:list){
            buffer.append((list.size() == (list.indexOf(e)+1))? e : e+div);
        }
        return buffer.toString();
    }
}
