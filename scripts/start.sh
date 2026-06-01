# start the service with the existed cluster
kubectl scale deployment auction-api --replicas=1
kubectl scale deployment auction-frontend --replicas=1
kubectl scale statefulset postgres --replicas=1

# or
# kubectl scale deployment --all --replicas=1 && \
# kubectl scale statefulset postgres --all --replicas=1