import scala.concurrent.{Future, Await}
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.duration._

object SimpleConcurrencyUtility {
  def runAsync[T](task: => T): Future[T] = Future {
    task
  }

  def awaitResult[T](future: Future[T], timeout: Duration = 10.seconds): T = {
    Await.result(future, timeout)
  }

  def main(args: Array[String]): Unit = {
    val future = runAsync {
      // Simulate a long-running task
      Thread.sleep(2000)
      "Task Completed"
    }

    val result = awaitResult(future)
    println(s"Result: $result")
  }
}