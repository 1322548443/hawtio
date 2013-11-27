package io.hawt.web;

import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.methods.GetMethod;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

import static java.lang.System.out;
/**
 * Created with IntelliJ IDEA.
 * User: prashant
 * Date: 26/11/13
 * Time: 2:03 PM
 * To change this template use File | Settings | File Templates.
 */
public class ExportContextServlet extends HttpServlet {

    private static final transient Logger LOG = LoggerFactory.getLogger(ExportContextServlet.class);

    @Override
    protected void doPost(HttpServletRequest httpServletRequest, HttpServletResponse resp) throws ServletException, IOException {
        out.println(" ===================== = jobExecution id ======================== "+httpServletRequest.getParameter("jobExecutionId"));
        String server = httpServletRequest.getParameter("server");
        String jobExecutionId = httpServletRequest.getParameter("jobExecutionId");
        String jobStepId = httpServletRequest.getParameter("jobStepId");

        out.println("======= server ======= "+server);
        out.println("======= jobExecutionId ======= "+jobStepId);
        out.println("======= jobStepId ======= "+jobStepId);

        String jsonStringResponse = "Content not available";
        if((server != null && !server.isEmpty())){
            if((jobExecutionId != null && !jobExecutionId.isEmpty())){
                server = server.replaceAll("\\\\","");
                if (!server.contains("http://")){
                    server = "http://"+server;
                }
                out.println("======= final url ======= "+server+"jobs/executions/"+jobExecutionId+"/context.json");

                HttpClient client = new HttpClient();
                GetMethod get = new GetMethod(server+"jobs/executions/"+jobExecutionId+"/context.json");
                int reponseCode =  client.executeMethod(get);
                jsonStringResponse = get.getResponseBodyAsString();
                JSONParser parser = new JSONParser();

                JSONObject jsonObject = null;
                try{
                    jsonObject = (JSONObject)parser.parse(jsonStringResponse);
                    out.println("======= jsonObject ======= "+jsonObject.getClass().getName());
                    JSONObject jobExecutionContext = (JSONObject)jsonObject.get("jobExecutionContext");
                    JSONObject contextObject = (JSONObject)jobExecutionContext.get("context");
                    out.println("======= contextObject ======= "+jobExecutionContext.toString());
                    out.println("======= entryObject ======= "+contextObject);

                }catch(ParseException pe){
                    LOG.error(pe.getMessage());
                }
                get.releaseConnection();
            }
            else if((jobStepId != null && !jobStepId.isEmpty())){

            }
        }

        resp.setHeader("Content-Disposition","attachment; filename=\"jsonData.txt\"");
        resp.getWriter().println(jsonStringResponse);
    }
}
