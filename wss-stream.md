Handshake
GET
wss://api.hume.ai/v0/stream/models

Headers
X-Hume-Api-Key
string
Required
Send
publish
object

Hide 7 properties
data
string
Optional
models
object
Optional
Configuration used to specify which models should be used and with what settings.


Hide 5 properties
burst
map from strings to any
Optional
Configuration for the vocal burst emotion model.

Note: Model configuration is not currently available in streaming.

Please use the default configuration by passing an empty object {}.

face
object
Optional
Configuration for the facial expression emotion model.

Note: Using the reset_stream parameter does not have any effect on face identification. A single face identifier cache is maintained over a full session whether reset_stream is used or not.


Hide 6 properties
facs
map from strings to any
Optional
Configuration for FACS predictions. If missing or null, no FACS predictions will be generated.

descriptions
map from strings to any
Optional
Configuration for Descriptions predictions. If missing or null, no Descriptions predictions will be generated.

identify_faces
boolean
Optional
Defaults to false
Whether to return identifiers for faces across frames. If true, unique identifiers will be assigned to face bounding boxes to differentiate different faces. If false, all faces will be tagged with an “unknown” ID.

fps_pred
double
Optional
Defaults to 3
Number of frames per second to process. Other frames will be omitted from the response.

prob_threshold
double
Optional
Defaults to 3
Face detection probability threshold. Faces detected with a probability less than this threshold will be omitted from the response.

min_face_size
double
Optional
Defaults to 3
Minimum bounding box side length in pixels to treat as a face. Faces detected with a bounding box side length in pixels less than this threshold will be omitted from the response.

facemesh
map from strings to any
Optional
Configuration for the facemesh emotion model.

Note: Model configuration is not currently available in streaming.

Please use the default configuration by passing an empty object {}.

language
object
Optional
Configuration for the language emotion model.


Hide 3 properties
sentiment
map from strings to any
Optional
Configuration for sentiment predictions. If missing or null, no sentiment predictions will be generated.

toxicity
map from strings to any
Optional
Configuration for toxicity predictions. If missing or null, no toxicity predictions will be generated.

granularity
string
Optional
The granularity at which to generate predictions. Values are word, sentence, utterance, or passage. To get a single prediction for the entire text of your streaming payload use passage. Default value is word.

prosody
map from strings to any
Optional
Configuration for the speech prosody emotion model.

Note: Model configuration is not currently available in streaming.

Please use the default configuration by passing an empty object {}.

stream_window_ms
double
Optional
>=500
<=10000
Defaults to 5000
Length in milliseconds of streaming sliding window.

Extending the length of this window will prepend media context from past payloads into the current payload.

For example, if on the first payload you send 500ms of data and on the second payload you send an additional 500ms of data, a window of at least 1000ms will allow the model to process all 1000ms of stream data.

A window of 600ms would append the full 500ms of the second payload to the last 100ms of the first payload.

Note: This feature is currently only supported for audio data and audio models. For other file types and models this parameter will be ignored.

reset_stream
boolean
Optional
Defaults to false
Whether to reset the streaming sliding window before processing the current payload.

If this parameter is set to true then past context will be deleted before processing the current payload.

Use reset_stream when one audio file is done being processed and you do not want context to leak across files.

raw_text
boolean
Optional
Defaults to false
Set to true to enable the data parameter to be parsed as raw text rather than base64 encoded bytes. This parameter is useful if you want to send text to be processed by the language model, but it cannot be used with other file types like audio, image, or video.

job_details
boolean
Optional
Defaults to false
Set to true to get details about the job.

This parameter can be set in the same payload as data or it can be set without data and models configuration to get the job details between payloads.

This parameter is useful to get the unique job ID.

payload_id
string
Optional
Pass an arbitrary string as the payload ID and get it back at the top level of the socket response.

This can be useful if you have multiple requests running asynchronously and want to disambiguate responses as they are received.

Receive
Stream Model Predictions
object
Model predictions


Hide 7 properties
payload_id
string
Optional
If a payload ID was passed in the request, the same payload ID will be sent back in the response body.

job_details
object
Optional
If the job_details flag was set in the request, details about the current streaming job will be returned in the response body.


Hide property
job_id
string
Optional
ID of the current streaming job.

burst
object
Optional
Response for the vocal burst emotion model.


Hide property
predictions
list of objects
Optional

Hide 2 properties
time
object
Optional
A time range with a beginning and end, measured in seconds.


Hide 2 properties
begin
double
Optional
>=0
Beginning of time range in seconds.

end
double
Optional
>=0
End of time range in seconds.

emotions
list of objects
Optional
A high-dimensional embedding in emotion space.


Hide 2 properties
name
string
Optional
Name of the emotion being expressed.

score
double
Optional
Embedding value for the emotion being expressed.

face
object
Optional
Response for the facial expression emotion model.


Hide property
predictions
list of objects
Optional

Hide 8 properties
frame
double
Optional
Frame number

time
double
Optional
Time in seconds when face detection occurred.

bbox
object
Optional
A bounding box around a face.


Hide 4 properties
x
double
Optional
>=0
x-coordinate of bounding box top left corner.

y
double
Optional
>=0
y-coordinate of bounding box top left corner.

w
double
Optional
>=0
Bounding box width.

h
double
Optional
>=0
Bounding box height.

prob
double
Optional
The predicted probability that a detected face was actually a face.

face_id
string
Optional
Identifier for a face. Not that this defaults to unknown unless face identification is enabled in the face model configuration.

emotions
list of objects
Optional
A high-dimensional embedding in emotion space.


Hide 2 properties
name
string
Optional
Name of the emotion being expressed.

score
double
Optional
Embedding value for the emotion being expressed.

facs
list of objects
Optional
A high-dimensional embedding in emotion space.


Hide 2 properties
name
string
Optional
Name of the emotion being expressed.

score
double
Optional
Embedding value for the emotion being expressed.

descriptions
list of objects
Optional
A high-dimensional embedding in emotion space.


Hide 2 properties
name
string
Optional
Name of the emotion being expressed.

score
double
Optional
Embedding value for the emotion being expressed.

facemesh
object
Optional
Response for the facemesh emotion model.


Hide property
predictions
list of objects
Optional

Hide property
emotions
list of objects
Optional
A high-dimensional embedding in emotion space.


Hide 2 properties
name
string
Optional
Name of the emotion being expressed.

score
double
Optional
Embedding value for the emotion being expressed.

language
object
Optional
Response for the language emotion model.


Hide property
predictions
list of objects
Optional

Hide 5 properties
text
string
Optional
A segment of text (like a word or a sentence).

position
object
Optional
Position of a segment of text within a larger document, measured in characters. Uses zero-based indexing. The beginning index is inclusive and the end index is exclusive.


Hide 2 properties
begin
double
Optional
>=0
The index of the first character in the text segment, inclusive.

end
double
Optional
>=0
The index of the last character in the text segment, exclusive.

emotions
list of objects
Optional
A high-dimensional embedding in emotion space.


Hide 2 properties
name
string
Optional
Name of the emotion being expressed.

score
double
Optional
Embedding value for the emotion being expressed.

sentiment
list of objects
Optional
Sentiment predictions returned as a distribution. This model predicts the probability that a given text could be interpreted as having each sentiment level from 1 (negative) to 9 (positive).

Compared to returning one estimate of sentiment, this enables a more nuanced analysis of a text’s meaning. For example, a text with very neutral sentiment would have an average rating of 5. But also a text that could be interpreted as having very positive sentiment or very negative sentiment would also have an average rating of 5. The average sentiment is less informative than the distribution over sentiment, so this API returns a value for each sentiment level.


Hide 2 properties
name
string
Optional
Level of sentiment, ranging from 1 (negative) to 9 (positive)

score
double
Optional
Prediction for this level of sentiment

toxicity
list of objects
Optional
Toxicity predictions returned as probabilities that the text can be classified into the following categories: toxic, severe_toxic, obscene, threat, insult, and identity_hate.


Hide 2 properties
name
string
Optional
Category of toxicity.

score
double
Optional
Prediction for this category of toxicity

prosody
object
Optional
Response for the speech prosody emotion model.


Hide property
predictions
list of objects
Optional

Hide 2 properties
time
object
Optional
A time range with a beginning and end, measured in seconds.


Hide 2 properties
begin
double
Optional
>=0
Beginning of time range in seconds.

end
double
Optional
>=0
End of time range in seconds.

emotions
list of objects
Optional
A high-dimensional embedding in emotion space.


Hide 2 properties
name
string
Optional
Name of the emotion being expressed.

score
double
Optional
Embedding value for the emotion being expressed.

OR
Stream Error Message
object
Error message


Hide 4 properties
error
string
Optional
Error message text.

code
string
Optional
Unique identifier for the error.

payload_id
string
Optional
If a payload ID was passed in the request, the same payload ID will be sent back in the response body.

job_details
object
Optional
If the job_details flag was set in the request, details about the current streaming job will be returned in the response body.


Hide property
job_id
string
Optional
ID of the current streaming job.

OR
Stream Warning Message
object
Warning message


Hide 4 properties
warning
string
Optional
Warning message text.

code
string
Optional
Unique identifier for the error.

payload_id
string
Optional
If a payload ID was passed in the request, the same payload ID will be sent back in the response body.

job_details
object
Optional
If the job_details flag was set in the request, details about the current streaming job will be returned in the response body.


Hide property
job_id
string
Optional
ID of the current streaming job.

