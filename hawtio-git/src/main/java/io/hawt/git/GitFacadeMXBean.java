package io.hawt.git;

import java.io.IOException;
import java.util.List;

/**
 * The JMX MBean interface for working with git configuration files
 */
public interface GitFacadeMXBean {
    /**
     * Reads the contents of a file or a directory
     */
    FileContents read(String branch, String path) throws IOException;

    void write(String branch, String path, String commitMessage,
               String authorName, String authorEmail, String contents);

    void remove(String branch, String path, String commitMessage,
                String authorName, String authorEmail);

    // TODO
    // void move(String branch, String oldPath, String newPath);

    String getHEAD();

    /**
     * Return the history of the repository or a specific directory or file path
     */
    List<CommitInfo> history(String objectId, String path, int limit);

    /**
     * Get the contents of a blobPath for a given commit objectId
     */
    String getContent(String objectId, String blobPath);


    /**
     * Performs a diff of the latest or a specifc version of the given blobPath
     * against either the previous or a given baseObjectId
     */
    String diff(String objectId, String baseObjectId, String blobPath);

    /**
     * Reverts the file to a previous value
     */
    void revertTo(String branch, String objectId, String blobPath, String commitMessage,
                  String authorName, String authorEmail);
}
