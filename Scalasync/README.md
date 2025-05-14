# Simple Concurrency Utility

This project contains a simple concurrency utility written in Scala. The utility allows you to run tasks asynchronously and wait for their results.

## How to Run

1. Ensure you have Scala installed on your machine. You can download it from [Scala's official website](https://www.scala-lang.org/download/).

2. Save the `SimpleConcurrencyUtility.scala` file in your project directory.

3. Open a terminal and navigate to the directory containing the `SimpleConcurrencyUtility.scala` file.

4. Run the following command to execute the Scala file:

   ```bash
   scala Concurrency.scala
   ```

## How to Test

To test the concurrency utility, you can use the `ScalaTest` framework. Follow these steps:

1. Add ScalaTest as a dependency in your build tool (e.g., SBT, Maven).

2. Create a test file named `SimpleConcurrencyUtilityTest.scala` with the following content:

   ```scala
    import org.scalatest.flatspec.AnyFlatSpec
    import org.scalatest.matchers.should.Matchers
    import scala.concurrent.ExecutionContext.Implicits.global
    import scala.concurrent.duration._
    import scala.concurrent.{Await, Future}

    class SimpleConcurrencyUtilityTest extends AnyFlatSpec with Matchers {
      "runAsync" should "execute a task asynchronously" in {
        val futureResult: Future[String] = SimpleConcurrencyUtility.runAsync {
          "Test Task"
        }
        val result = Await.result(futureResult, 5.seconds)
        result should be("Test Task")
      }

      "awaitResult" should "wait for the task to complete and return the result" in {
        val futureResult: Future[String] = SimpleConcurrencyUtility.runAsync {
          "Test Task"
        }
        val result = SimpleConcurrencyUtility.awaitResult(futureResult, 5.seconds)
        result should be("Test Task")
      }
    }
   ```

3. Run the tests using your build tool's test command. For example, if you're using SBT, run:
   ```bash
   sbt test
   ```

The tests should pass, indicating that the concurrency utility works as expected.
