module Core {

  export class PostLoginTasks {

    private tasks:any = {};
    private tasksExecuted = false;

    private addTask(name, task) {
      this.tasks[name] = task;
      if (this.tasksExecuted) {
        this.executeTask(name, task);
      }
    }

    private executeTask(name:string, task: () => void) {
      if (angular.isFunction(task)) {
        log.debug("Executing task : ", name);
        try {
          task();
        } catch (error) {
          log.debug("Failed to execute task: ", name, " error: ", error);
        }
      }
    }

    public execute() {
      if (this.tasksExecuted) {
        return;
      }
      angular.forEach(this.tasks, (task:() => void, name) => {
        this.executeTask(name, task);
      });
      this.tasksExecuted = true;
    }

    public reset() {
      this.tasksExecuted = false;
    }
  }

  export var postLoginTasks = new Core.PostLoginTasks();

}
