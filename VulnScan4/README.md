Setup `python -m spacy download en_core_web_trf`

## Check logs

> [!NOTE]
> Only for models trained within commit ranges `0d01d04` - `6ab42ea`

To check the model logs generated, just run the following command:
```shell
tensorboard --logdir="./training_output/SPECIFIC_MODEL/tb_logs"
```

Then go to the browser and type `localhost:6006` to see the logs.
