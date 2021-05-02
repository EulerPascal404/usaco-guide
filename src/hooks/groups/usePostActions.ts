import {
  addDoc,
  collection,
  deleteField,
  doc,
  getFirestore,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { useContext } from 'react';
import UserDataContext from '../../context/UserDataContext/UserDataContext';
import { PostData } from '../../models/groups/posts';
import {
  GroupProblemData,
  Submission,
  SubmissionType,
} from '../../models/groups/problem';
import { useFirebaseApp } from '../useFirebase';

export function usePostActions(groupId: string) {
  const firebaseApp = useFirebaseApp();
  const { firebaseUser, setUserProgressOnProblems } = useContext(
    UserDataContext
  );

  const updatePost = async (postId: string, updatedData: Partial<PostData>) => {
    await updateDoc(
      doc(getFirestore(firebaseApp), 'groups', groupId, 'posts', postId),
      updatedData
    );
  };

  return {
    createNewPost: async (type: 'announcement' | 'assignment') => {
      const defaultPost: Omit<PostData, 'timestamp'> = {
        name: 'Untitled Post',
        isPublished: false,
        isPinned: false,
        body: '',
        isDeleted: false,
        type,
        ...(type === 'announcement'
          ? {}
          : {
              dueTimestamp: null,
            }),
      };
      const doc = await addDoc(
        collection(getFirestore(firebaseApp), 'groups', groupId, 'posts'),
        { ...defaultPost, timestamp: serverTimestamp() }
      );
      return doc.id;
    },
    deletePost: async (postId: string): Promise<void> => {
      const firestore = getFirestore(firebaseApp);
      const batch = writeBatch(firestore);

      batch.update(doc(firestore, 'groups', groupId, 'posts', postId), {
        isDeleted: true,
      });
      batch.update(doc(firestore, 'groups', groupId), {
        [`leaderboard.${postId}`]: deleteField(),
      });
      return batch.commit();
    },
    updatePost,
    createNewProblem: async (post: PostData, order = 10) => {
      const defaultProblem: Omit<GroupProblemData, 'id'> = {
        postId: post.id,
        name: 'Untitled Problem',
        body: '',
        source: '',
        points: 100,
        difficulty: 'Normal',
        hints: [],
        solution: null,
        submissionType: SubmissionType.SELF_GRADED,
        isDeleted: false,
        usacoGuideId: null,
        solutionReleaseMode: 'due-date',
        order,
      };
      const doc = await addDoc(
        collection(
          getFirestore(firebaseApp),
          'groups',
          groupId,
          'posts',
          post.id,
          'problems'
        ),
        defaultProblem
      );
      return doc.id;
    },
    saveProblem: async (post: PostData, problem: GroupProblemData) => {
      if (
        problem.solutionReleaseMode == 'custom' &&
        !problem.solutionReleaseTimestamp
      ) {
        alert(
          'If you set the solution release mode to custom, you must set a solution release timestamp.'
        );
        return;
      }
      await updateDoc(
        doc(
          getFirestore(firebaseApp),
          'groups',
          groupId,
          'posts',
          post.id,
          'problems',
          problem.id
        ),
        problem
      );
    },
    deleteProblem: async (post: PostData, problemId: string) => {
      const firestore = getFirestore(firebaseApp);
      const batch = writeBatch(firestore);
      batch.update(
        doc(
          firestore,
          'groups',
          groupId,
          'posts',
          post.id,
          'problems',
          problemId
        ),
        {
          isDeleted: true,
        }
      );
      batch.update(doc(firestore, 'groups', groupId), {
        [`leaderboard.${post.id}.${problemId}`]: deleteField(),
      });
      await batch.commit();
    },
    submitSolution: async (
      problem: GroupProblemData,
      submission: Partial<Submission>
    ) => {
      if (problem.usacoGuideId) {
        setUserProgressOnProblems(problem.usacoGuideId, 'Solved');
      }
      const doc = await addDoc(
        collection(
          getFirestore(firebaseApp),
          'groups',
          groupId,
          'posts',
          problem.postId,
          'problems',
          problem.id,
          'submissions'
        ),
        {
          ...submission,
          timestamp: serverTimestamp(),
          userId: firebaseUser.uid,
        }
      );
      return doc.id;
    },
  };
}
